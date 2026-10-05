"""Regras oficiais EA20. Sem inferência de eleição por votação."""
import re

ELECTED = {'Eleito', 'Eleito por QP', 'Eleito por média'}
STATUS = {'': 'EM TOTALIZAÇÃO', 'Eleito': 'ELEITO', 'Eleito por QP': 'ELEITO',
          'Eleito por média': 'ELEITO', 'Não eleito': 'NÃO ELEITO', '2º turno': '2º TURNO', 'Suplente': 'SUPLENTE'}


def number(value):
    if not re.fullmatch(r'\d+', str(value)):
        raise ValueError(f'Inteiro não negativo esperado: {value!r}')
    return int(value)


def decimal(value):
    return float(str(value).replace(',', '.'))


def official_status(candidate):
    st = candidate.get('st', '')
    if st not in STATUS:
        raise ValueError(f'Situação oficial desconhecida: {st!r}')
    if st in ELECTED and candidate.get('e') != 's':
        raise ValueError('Situação de eleito contraditória')
    return STATUS[st]


def municipal_leaders(candidates, votes):
    for value in votes.values():
        number(value)
    elected = [c for c in candidates if c['status'] == 'ELEITO']
    if not elected:
        return {'status': 'pending', 'leaders': []}
    if any(c['id'] not in votes for c in elected):
        raise ValueError('Candidato eleito ausente no arquivo municipal')
    high = max(votes[c['id']] for c in elected)
    if high == 0:
        return {'status': 'no_votes', 'leaders': []}
    leaders = [{'id': c['id'], 'votes': votes[c['id']]} for c in elected if votes[c['id']] == high]
    return {'status': 'tie' if len(leaders) > 1 else 'unique', 'leaders': leaders}


def iter_candidates(data):
    for office in data['carg']:
        for group in office['agr']:
            for party in group['par']:
                for candidate in party['cand']:
                    yield office, group, party, candidate


def validate_result(data, election, office, scope):
    if data.get('f') != 'o' or str(data.get('ele')) != str(election) or data.get('t') != '1':
        raise ValueError('Ambiente, eleição ou turno incorreto')
    if str(data.get('cdabr')).lower() != scope.lower():
        raise ValueError('Abrangência incorreta')
    kind = 'br' if scope == 'br' else ('mu' if scope.isdigit() else 'uf')
    if data.get('tpabr') != kind:
        raise ValueError('Tipo de abrangência incorreto')
    if len(data.get('carg', [])) != 1 or str(data['carg'][0]['cd']) != str(office):
        raise ValueError('Cargo incorreto')
    rows = list(iter_candidates(data))
    if not rows:
        raise ValueError('Arquivo sem candidatos')
    ids = [c['sqcand'] for _, _, _, c in rows]
    if len(ids) != len(set(ids)):
        raise ValueError('Candidatos duplicados')
    for _, _, party, c in rows:
        number(c['sqcand'])
        if not re.fullmatch(r'[\w .+-]{1,40}', party['sg']):
            raise ValueError('Sigla de partido inválida')
        number(c['vap'])
    if number(data['s']['st']) > number(data['s']['ts']):
        raise ValueError('Seções totalizadas excedem total')
    number(data['v']['vv'])


def normalize_result(data, uf, source):
    office = int(data['carg'][0]['cd'])
    rows = []
    for _, group, party, c in iter_candidates(data):
        rows.append({'id': c['sqcand'], 'number': c['n'], 'name': c['nmu'], 'fullName': c['nm'],
                     'party': party['sg'], 'partyName': party['nm'], 'federation': party.get('nfed') or None,
                     'coalition': group['nm'], 'uf': uf.upper(), 'office': office,
                     'votes': number(c['vap']), 'percent': decimal(c['pvapn']),
                     'status': official_status(c), 'officialStatus': c['st'], 'elected': c['st'] in ELECTED,
                     'secondRound': c['st'] == '2º turno', 'destination': c.get('dvt'),
                     'registrationStatus': None, 'round': int(data['t'])})
    rows.sort(key=lambda c: (-c['votes'], c['id']))
    elected_votes = sorted([c['votes'] for c in rows if c['elected']], reverse=True)
    all_votes = [c['votes'] for c in rows]
    for c in rows:
        c['rank'] = 1 + sum(v > c['votes'] for v in all_votes)
        c['electedRank'] = 1 + sum(v > c['votes'] for v in elected_votes) if c['elected'] else None
    parties = []
    for group in data['carg'][0]['agr']:
        for party in group['par']:
            nominal = number(party['tvtn'])
            legend = number(party['tvtl']) if 'tvtl' in party else None
            total = nominal + (legend or 0)
            parties.append({'party': party['sg'], 'office': office, 'uf': uf.upper(), 'nominal': nominal,
                            'legend': legend, 'total': total, 'percent': 100 * total / number(data['v']['vv']) if number(data['v']['vv']) else None,
                            'elected': sum(c['elected'] for c in rows if c['party'] == party['sg']),
                            'secondRound': sum(c['secondRound'] for c in rows if c['party'] == party['sg'])})
    return {'office': office, 'name': data['carg'][0]['nmn'], 'seats': number(data['carg'][0]['nv']),
            'candidates': rows, 'parties': parties, 'meta': metadata(data, source)}


def metadata(data, source):
    return {'election': data['ele'], 'round': int(data['t']), 'scope': data['cdabr'],
            'sections': number(data['s']['ts']), 'counted': number(data['s']['st']),
            'percent': decimal(data['s'].get('pstn', data['s']['pst'])),
            'final': data['tf'] == 's', 'progress': data['and'], 'mathematical': data.get('md'),
            'noElected': data.get('esae') == 's', 'noElectedReasons': data.get('mnae', []),
            'sourceTime': data['dt'] + ' ' + data['ht'], 'generatedTime': data['dg'] + ' ' + data['hg'],
            'validVotes': number(data['v']['vv']), 'nominalVotes': number(data['v']['vnom']),
            'turnout': number(data['e']['c']), 'abstention': number(data['e']['a']),
            'turnoutPercent': decimal(data['e']['pcn']), 'abstentionPercent': decimal(data['e']['pan']),
            **source}

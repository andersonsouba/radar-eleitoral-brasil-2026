"""Consulta municipal completa por cargo, sem inferir situação eleitoral."""
from electoral import number


def municipal_candidates(candidates, votes, valid_votes):
    if set(votes) != {c['id'] for c in candidates}:
        raise ValueError('Cobertura municipal de candidatos incompleta')
    valid_votes = number(valid_votes)
    counts = {cid: number(value) for cid, value in votes.items()}
    rows = [dict(c, stateVotes=c['votes'], votes=counts[c['id']],
                 percent=100 * counts[c['id']] / valid_votes if valid_votes else None)
            for c in candidates if counts[c['id']] > 0]
    rows.sort(key=lambda c: (-c['votes'], c['name'], c['id']))
    previous = None
    for index, candidate in enumerate(rows, 1):
        if candidate['votes'] != previous:
            rank = index
        candidate['rank'] = rank
        previous = candidate['votes']
    return rows

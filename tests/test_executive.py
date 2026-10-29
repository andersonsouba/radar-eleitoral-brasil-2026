import copy
import unittest
from scripts.update_executive import discover_executive, inherit_presidential_status, refresh_metadata


def config():
    return {'f': 'o', 'pl': [
        {'c': 'ele2026', 'dt': '04/10/2026', 'e': [
            {'cd': '6257', 'cdt2': '6258', 't': '1', 'abr': [{'cd': 'br', 'cp': [{'cd': '1'}]}]},
            {'cd': '6259', 'cdt2': '6260', 't': '1', 'abr': [{'cd': 'br', 'cp': [{'cd': '3'}]}]}]},
        {'c': 'ele2026', 'dt': '25/10/2026', 'e': [
            {'cd': '6258', 't': '2', 'abr': [{'cd': 'br', 'cp': [{'cd': '1'}]}]},
            {'cd': '6260', 't': '2', 'abr': [{'cd': 'ac', 'cp': [{'cd': '3'}]}]},
            {'cd': '9999', 't': '1', 'abr': [{'cd': 'sp', 'cp': [{'cd': '11'}]}]}]}]}


class ExecutiveUpdate(unittest.TestCase):
    def test_coverage_and_divergences_replace_only_executive_portion(self):
        overview = {'candidates': 100, 'municipalRows': 1000, 'validation': {}}
        validation = {'aggregationDivergences': [{'uf': 'AC', 'office': 1}, {'uf': 'SP', 'office': 6}]}
        refresh_metadata(overview, validation, -8, -100, [{'uf': 'AM', 'office': 3, 'id': '1'}])
        self.assertEqual(overview['candidates'], 92)
        self.assertEqual(overview['municipalRows'], 900)
        self.assertEqual({(d['uf'], d['office']) for d in validation['aggregationDivergences']}, {('SP', 6), ('AM', 3)})
        self.assertEqual(overview['validation']['aggregationDivergences'], validation['aggregationDivergences'])

    def test_catalog_discovers_only_linked_second_round_general_elections(self):
        result = discover_executive(config())
        self.assertEqual(result['president'], '6258')
        self.assertEqual(result['governor'], '6260')
        self.assertEqual(result['governorStates'], ['ac'])
        self.assertEqual(result['firstGovernor'], '6259')

    def test_missing_or_unlinked_second_round_is_rejected(self):
        for change in ('missing', 'unlinked', 'simulation'):
            data = copy.deepcopy(config())
            if change == 'missing':
                data['pl'][1]['e'] = []
            elif change == 'unlinked':
                data['pl'][1]['e'][0]['cd'] = '9000'
            else:
                data['f'] = 's'
            with self.assertRaises(ValueError):
                discover_executive(data)

    def test_president_local_leader_never_determines_national_election(self):
        national = {'candidates': [{'id': '1', 'status': 'ELEITO', 'officialStatus': 'Eleito', 'elected': True, 'secondRound': False},
                                   {'id': '2', 'status': 'NÃO ELEITO', 'officialStatus': 'Não eleito', 'elected': False, 'secondRound': False}]}
        local = {'candidates': [{'id': '2', 'votes': 900}, {'id': '1', 'votes': 100}]}
        inherit_presidential_status(local, national)
        self.assertFalse(local['candidates'][0]['elected'])
        self.assertTrue(local['candidates'][1]['elected'])
        with self.assertRaises(ValueError):
            inherit_presidential_status({'candidates': [{'id': '3'}]}, national)

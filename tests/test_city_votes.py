import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from city_votes import municipal_candidates


class CityVotes(unittest.TestCase):
    def setUp(self):
        self.candidates = [
            {'id': 'e', 'name': 'Eleito', 'votes': 1000, 'elected': True, 'status': 'ELEITO'},
            {'id': 'n', 'name': 'Não eleito', 'votes': 500, 'elected': False, 'status': 'NÃO ELEITO'},
            {'id': 'z', 'name': 'Sem votos', 'votes': 100, 'elected': True, 'status': 'ELEITO'},
        ]

    def test_includes_non_elected_and_excludes_zero_without_changing_status(self):
        rows = municipal_candidates(self.candidates, {'e': 20, 'n': 40, 'z': 0}, 100)
        self.assertEqual([r['id'] for r in rows], ['n', 'e'])
        self.assertEqual(rows[0]['status'], 'NÃO ELEITO')
        self.assertFalse(rows[0]['elected'])
        self.assertEqual(rows[0]['percent'], 40)
        self.assertEqual(rows[0]['stateVotes'], 500)
        self.assertEqual(self.candidates[0]['votes'], 1000)

    def test_ties_keep_same_rank_and_next_position_skips(self):
        rows = municipal_candidates(self.candidates, {'e': 20, 'n': 20, 'z': 5}, 100)
        self.assertEqual([r['rank'] for r in rows], [1, 1, 3])

    def test_zero_votes_is_empty_not_a_winner(self):
        self.assertEqual(municipal_candidates(self.candidates, dict.fromkeys(['e','n','z'],0),0), [])

    def test_incomplete_or_invalid_counts_fail_closed(self):
        for votes in [{'e': 20}, {'e': 20, 'n': -1, 'z': 0}]:
            with self.assertRaises(ValueError):
                municipal_candidates(self.candidates, votes, 100)


if __name__ == '__main__':
    unittest.main()

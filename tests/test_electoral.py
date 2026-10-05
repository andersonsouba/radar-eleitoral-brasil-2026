import copy
import unittest
from scripts.electoral import municipal_leaders, official_status, validate_result


class ElectoralRules(unittest.TestCase):
    def setUp(self):
        self.candidates = [
            {"id": "A", "status": "ELEITO", "party": "P1"},
            {"id": "B", "status": "NÃO ELEITO", "party": "P2"},
            {"id": "C", "status": "ELEITO", "party": "P3"},
        ]

    def test_non_elected_with_more_votes_never_leads(self):
        result = municipal_leaders(self.candidates, {"A": 5000, "B": 8000, "C": 4000})
        self.assertEqual(result["status"], "unique")
        self.assertEqual(result["leaders"], [{"id": "A", "votes": 5000}])

    def test_real_tie_has_no_invented_tiebreak(self):
        result = municipal_leaders(self.candidates, {"A": 5000, "B": 9000, "C": 5000})
        self.assertEqual(result["status"], "tie")
        self.assertEqual({x["id"] for x in result["leaders"]}, {"A", "C"})

    def test_zero_votes_do_not_create_territorial_leadership(self):
        self.assertEqual(municipal_leaders(self.candidates, {"A": 0, "C": 0})["status"], "no_votes")

    def test_no_confirmed_elected_is_pending(self):
        self.assertEqual(municipal_leaders([], {"B": 8000})["status"], "pending")

    def test_negative_votes_rejected(self):
        with self.assertRaises(ValueError):
            municipal_leaders(self.candidates, {"A": -1})

    def test_e_s_alone_does_not_prove_election(self):
        self.assertEqual(official_status({"e": "s", "st": ""}), "EM TOTALIZAÇÃO")
        self.assertEqual(official_status({"e": "s", "st": "2º turno"}), "2º TURNO")

    def test_only_exact_official_elected_statuses(self):
        for st in ["Eleito", "Eleito por QP", "Eleito por média"]:
            self.assertEqual(official_status({"e": "s", "st": st}), "ELEITO")
        self.assertEqual(official_status({"e": "n", "st": "Não eleito"}), "NÃO ELEITO")
        self.assertEqual(official_status({"e": "n", "st": "Suplente"}), "SUPLENTE")
        with self.assertRaises(ValueError):
            official_status({"e": "s", "st": "Situação nova"})

    def test_reject_wrong_environment_election_scope_and_cargo(self):
        base = {"f": "o", "ele": "6259", "t": "1", "tpabr": "uf", "cdabr": "ac",
                "carg": [{"cd": "6", "agr": [{"par": [{"sg": "P1", "cand": [{"sqcand": "1", "vap": "5"}]}]}]}],
                "s": {"ts": "10", "st": "10"}, "v": {"vv": "5"}}
        validate_result(base, "6259", 6, "ac")
        for key, value in [("f", "s"), ("ele", "21272"), ("cdabr", "sp"), ("t", "2")]:
            item = copy.deepcopy(base); item[key] = value
            with self.assertRaises(ValueError, msg=key):
                validate_result(item, "6259", 6, "ac")
        with self.assertRaises(ValueError):
            validate_result(base, "6259", 7, "ac")
        malicious = copy.deepcopy(base)
        malicious['carg'][0]['agr'][0]['par'][0]['cand'][0]['sqcand'] = '../../escape'
        with self.assertRaises(ValueError):
            validate_result(malicious, '6259', 6, 'ac')
        malicious = copy.deepcopy(base)
        malicious['carg'][0]['agr'][0]['par'][0]['sg'] = '../escape'
        with self.assertRaises(ValueError):
            validate_result(malicious, '6259', 6, 'ac')


if __name__ == "__main__":
    unittest.main()

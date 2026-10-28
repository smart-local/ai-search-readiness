import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import ai_search_readiness as asr

HERE = os.path.dirname(os.path.abspath(__file__))


class SampleTest(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(HERE, "sample.html"), encoding="utf-8") as f:
            self.results = asr.check(f.read(), "https://example.com.au/caloundra/", fetch_site=False)
        self.by = {}
        for r in self.results:
            self.by.setdefault(r["area"], []).append(r["status"])

    def test_basics(self):
        self.assertEqual(self.by["Title"], ["pass"])
        self.assertEqual(self.by["H1"], ["pass"])
        self.assertEqual(self.by["Canonical"], ["pass"])

    def test_alt_text_warns(self):
        self.assertEqual(self.by["Image alt text"], ["warn"])

    def test_nap_matches(self):
        self.assertEqual(self.by["NAP: phone"], ["pass"])
        self.assertEqual(self.by["NAP: address"], ["pass"])
        self.assertEqual(self.by["NAP: name"], ["pass"])

    def test_missing_schema_props(self):
        self.assertEqual(self.by["Business schema"], ["warn"])

    def test_robots_parser(self):
        g = asr.parse_robots("User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n")
        self.assertTrue(asr.robots_blocks_root(g, "GPTBot"))
        self.assertFalse(asr.robots_blocks_root(g, "ClaudeBot"))


if __name__ == "__main__":
    unittest.main()

"""Unit tests for the pure parts of tools/post.py and tools/check_spec.py (no network, no rendering).

  python3 -m unittest discover -s tools/tests -v
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import check_spec  # noqa: E402
import post  # noqa: E402


class CaptionTests(unittest.TestCase):
    def test_hashtags_counted(self):
        self.assertEqual(post.hashtags("Hi #one, #Two and #three!"), ["#one", "#two", "#three"])

    def test_encoded_hash_blocks(self):
        self.assertTrue(any("%23" in p for p in post.caption_problems("hello %23startup")))

    def test_empty_blocks(self):
        self.assertTrue(post.caption_problems("   "))

    def test_too_many_hashtags_warns_but_does_not_block(self):
        cap = "x " + " ".join(f"#t{i}" for i in range(6))
        self.assertTrue(post.caption_warnings(cap))
        self.assertFalse(post.caption_problems(cap))


class ApprovalTests(unittest.TestCase):
    def setUp(self):
        self.ok = {"file": "v.mp4", "videoSha256": "a" * 64, "captionSha256": "b" * 64}

    def test_matching_approval_passes(self):
        post.check_approval(self.ok, "v.mp4", "a" * 64, "b" * 64)

    def test_missing_approval_fails(self):
        with self.assertRaises(post.PostError):
            post.check_approval(None, "v.mp4", "a" * 64, "b" * 64)

    def test_changed_video_fails(self):
        with self.assertRaises(post.PostError):
            post.check_approval(self.ok, "v.mp4", "c" * 64, "b" * 64)

    def test_changed_caption_fails(self):
        with self.assertRaises(post.PostError):
            post.check_approval(self.ok, "v.mp4", "a" * 64, "c" * 64)

    def test_other_file_fails(self):
        with self.assertRaises(post.PostError):
            post.check_approval(self.ok, "other.mp4", "a" * 64, "b" * 64)

    def test_idempotency_key_is_stable_and_specific(self):
        k1 = post.idempotency_key("a", "b", ["tiktok", "instagram"], "now", None)
        k2 = post.idempotency_key("a", "b", ["instagram", "tiktok"], "now", None)
        self.assertEqual(k1, k2)
        self.assertNotEqual(k1, post.idempotency_key("a", "b", ["tiktok"], "now", None))


class BodyTests(unittest.TestCase):
    def body(self, platforms, mode, **kw):
        cfg = post.load_config(Path("/nonexistent/posting.json"))
        accounts = {p: f"{p}-id" for p in platforms}
        return post.build_post_body(media_url="https://x/v.mp4", caption="Hi?", platforms=platforms, accounts=accounts,
                                    cfg=cfg, spec={"covers": [45], "_id": "v"}, mode=mode, **kw)

    def test_now_both_platforms(self):
        b = self.body(["instagram", "tiktok"], "now")
        self.assertTrue(b["publishNow"])
        self.assertNotIn("isDraft", b)
        self.assertEqual(b["platforms"][0]["platformSpecificData"]["thumbOffset"], 1500)
        tt = b["tiktokSettings"]
        self.assertTrue(tt["content_preview_confirmed"])
        self.assertTrue(tt["express_consent_given"])
        self.assertEqual(tt["video_cover_timestamp_ms"], 1500)
        self.assertEqual(tt["privacy_level"], "PUBLIC_TO_EVERYONE")

    def test_draft_without_tiktok(self):
        b = self.body(["instagram"], "draft")
        self.assertTrue(b["isDraft"])
        self.assertNotIn("tiktokSettings", b)

    def test_schedule_needs_a_time(self):
        with self.assertRaises(post.PostError):
            self.body(["tiktok"], "at")
        b = self.body(["tiktok"], "at", at="2026-10-12T18:30", tz="Europe/Berlin")
        self.assertEqual(b["scheduledFor"], "2026-10-12T18:30")
        self.assertEqual(b["timezone"], "Europe/Berlin")

    def test_media_limits(self):
        info = {"width": 1080, "height": 1920, "seconds": 120}
        probs = post.media_problems(info, 10 * 1024**2, ["instagram", "tiktok"])
        self.assertEqual(len(probs), 1)
        self.assertIn("instagram", probs[0])

    def test_mask_hides_key(self):
        self.assertNotIn("sk_secret123", post.mask("error for sk_secret123", ("sk_secret123",)))


class SpecCheckTests(unittest.TestCase):
    def check(self, spec):
        with tempfile.TemporaryDirectory() as d:
            Path(d, "spec.json").write_text(json.dumps(spec))
            return check_spec.check(Path(d))

    def test_clean_spec(self):
        errors, warnings, info = self.check({
            "scenes": [{"dur": 3, "words": [{"t": 0.1, "text": "hi", "size": 100, "x": 50, "y": 40}]}],
            "post": {"caption": "ok?", "hashtags": ["a"]},
        })
        self.assertEqual(errors, [])
        self.assertEqual(warnings, [])
        self.assertEqual(info["frames"], 90)

    def test_missing_media_is_an_error(self):
        errors, _, _ = self.check({"scenes": [{"dur": 3, "media": {"file": "nope.mp4"}}]})
        self.assertTrue(any("nope.mp4" in e for e in errors))

    def test_text_in_bottom_zone_warns(self):
        _, warnings, _ = self.check({
            "scenes": [{"dur": 3, "words": [{"t": 0, "text": "@handle", "size": 60, "x": 50, "y": 82}]}],
            "post": {"caption": "q?"},
        })
        self.assertTrue(any("bottom" in w for w in warnings))

    def test_two_climaxes_is_an_error(self):
        errors, _, _ = self.check({"scenes": [{"dur": 2, "climax": True}, {"dur": 2, "climax": True}]})
        self.assertTrue(any("climax" in e for e in errors))

    def test_hashtag_rules(self):
        _, warnings, _ = self.check({"scenes": [{"dur": 4}],
                                     "post": {"caption": "no question", "hashtags": ["fyp", "a", "b", "c", "d", "e"]}})
        text = " ".join(warnings)
        self.assertIn("6 hashtags", text)
        self.assertIn("#fyp", text)
        self.assertIn("question", text)


if __name__ == "__main__":
    unittest.main()

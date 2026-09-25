import unittest

from app.resources import list_resources


class ResourceCatalogTests(unittest.TestCase):
    def test_filters_by_domain_and_topic(self):
        resources = list_resources(domain="dsa", topic_id="dsa.dynamic-programming")
        self.assertTrue(resources)
        self.assertTrue(all(item["domain"] == "dsa" for item in resources))
        self.assertTrue(all(item["topic_id"] == "dsa.dynamic-programming" for item in resources))

    def test_video_resources_are_embeddable(self):
        resources = list_resources(resource_type="video")
        self.assertTrue(resources)
        self.assertTrue(all(item["can_embed"] for item in resources))

    def test_limit_is_respected(self):
        self.assertEqual(len(list_resources(limit=3)), 3)


if __name__ == "__main__":
    unittest.main()
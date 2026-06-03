import os

from locust import HttpUser, between, task


def _auth_header():
    token = os.environ.get("PF_TOKEN", "")
    if not token:
        return {}
    return {"Authorization": f"Bearer {token}"}


class ProjectForgeUser(HttpUser):
    wait_time = between(0.5, 1.5)

    @task(6)
    def browse_projects(self):
        self.client.get("/api/projects", params={"page": 1, "limit": 10})

    @task(2)
    def recommendations(self):
        self.client.get(
            "/api/projects/recommendations",
            params={"limit": 5},
            headers=_auth_header(),
        )

    @task(2)
    def me(self):
        self.client.get("/api/auth/me", headers=_auth_header())

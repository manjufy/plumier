import { GitHubLoginStatus, GitHubProvider, oAuthCallback } from "@plumier/social-login"
import { bind, response, route } from "plumier"
import qs from "querystring"

import { github } from "../config"


export class GithubController {
    @route.get()
    login() {
        const query = qs.stringify({
            state: "state",
            redirect_uri: github.redirectUri,
            client_id: github.appId,
        })
        const dialog = "https://github.com/login/oauth/authorize?" + query
        return response.redirect(dialog)
    }

    @oAuthCallback(new GitHubProvider(github.appId, github.appSecret))
    callback(@bind.loginStatus() profile: GitHubLoginStatus) {
        return profile
    }
}
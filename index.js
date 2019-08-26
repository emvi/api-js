const axios = require("axios");

const grantType = "client_credentials";
const authenticationHost = "https://auth.emvi.com";
const apiHost = "https://api.emvi.com";
const authenticationEndpoint = "/api/v1/auth/token";
const searchArticlesEndpoint = "/api/v1/search/article";

module.exports = class EmviClient {
	constructor(client_id, client_secret, organization, config) {
		this.client_id = client_id;
		this.client_secret = client_secret;
		this.organization = organization;

		if(typeof config !== "object") {
			config = {};
		}

		this.auth_host = config.auth_host || authenticationHost;
		this.api_host = config.api_host || apiHost;

		this.refreshToken()
		.catch(e => {
			throw new Error(`error refreshing token: ${e.message}`);
		});
	}

	refreshToken() {
		return new Promise((resolve, reject) => {
			let req = {
				grant_type: grantType,
                client_id: this.client_id,
                client_secret: this.client_secret
			};

			axios.post(this.auth_host+authenticationEndpoint, req)
			.then(r => {
				this.token_type = r.data.token_type;
                this.access_token = r.data.access_token;
                this.expires_in = parseInt(r.data.expires_in);
                resolve();
			})
			.catch(e => {
				reject(e);
			});
		});
	}

	findArticles(query, filter) {
		if(typeof query !== "string") {
			throw new TypeError("query must be of type string");
		}

		if(filter === undefined || filter === null) {
			filter = {};
		}

		if(typeof filter !== "object") {
			throw new TypeError("filter must be of type object");
		}

		filter.query = query;

		return new Promise((resolve, reject) => {
			axios.get(this.api_host+searchArticlesEndpoint, {params: filter}, this._config())
			.then(r => {
				let results = r.data.articles ? r.data.articles : [];
				resolve({results, count: r.data.count});
			})
			.catch(e => {
				reject(e);
			});
		});
	}

	_config() {
		return {
			headers: {
				"Authorization": `Bearer ${this.access_token}`,
				"Organization": this.organization,
				"Client": this.client_id
			}
		};
	}
};

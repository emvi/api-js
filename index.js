const axios = require("axios");

const grantType = "client_credentials";
const authenticationHost = "https://auth.emvi.com";
const apiHost = "https://api.emvi.com";
const authenticationEndpoint = "/api/v1/auth/token";
const searchArticlesEndpoint = "/api/v1/search/article";
const searchListsEndpoint = "/api/v1/search/list";
const searchTagsEndpoint = "/api/v1/search/tag";
const searchAllEndpoint = "/api/v1/search";
const organizationEndpoint = "/api/v1/organization";
const articleEndpoint = "/api/v1/article/{id}";
const articleHistoryEndpoint = "/api/v1/article/{id}/history";
const languagesEndpoint = "/api/v1/lang";
const languageEndpoint = "/api/v1/lang/{id}";
const pinnedEndpoint = "/api/v1/pin";
const listEndpoint = "/api/v1/articlelist/{id}";
const listEntriesEndpoint = "/api/v1/articlelist/{id}/entry";
const tagEndpoint = "/api/v1/tag/{name}";

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
		this.token_type = window.localStorage.getItem("token_type");
        this.access_token = window.localStorage.getItem("access_token");
        this.expires_in = window.localStorage.getItem("expires_in");
		this._addAxiosInterceptor();
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
                window.localStorage.setItem("token_type", this.token_type);
                window.localStorage.setItem("access_token", this.access_token);
                window.localStorage.setItem("expires_in", this.expires_in);
                resolve();
			})
			.catch(e => {
				reject(e);
			});
		});
	}

	findArticles(query, filter) {
		filter = this._checkSearchParamsAndBuildFilter(query, filter);

		return new Promise((resolve, reject) => {
			axios.get(this.api_host+searchArticlesEndpoint, {headers: this._config().headers, params: filter})
			.then(r => {
				r.data.articles = r.data.articles || [];
				resolve(r.data);
			});
		});
	}

	findLists(query, filter) {
		filter = this._checkSearchParamsAndBuildFilter(query, filter);

		return new Promise((resolve, reject) => {
			axios.get(this.api_host+searchListsEndpoint, {headers: this._config().headers, params: filter})
			.then(r => {
				r.data.lists = r.data.lists || [];
				resolve(r.data);
			});
		});
	}

	findTags(query, filter) {
		filter = this._checkSearchParamsAndBuildFilter(query, filter);

		return new Promise((resolve, reject) => {
			axios.get(this.api_host+searchTagsEndpoint, {headers: this._config().headers, params: filter})
			.then(r => {
				r.data.tags = r.data.tags || [];
				resolve(r.data);
			});
		});
	}

	findAll(query, filter) {
		let filterProvided = filter !== undefined && filter !== null;
		filter = this._checkSearchParamsAndBuildFilter(query, filter);

		if(!filterProvided) {
			filter = {
				articles: true,
				lists: true,
				tags: true,
				articles_limit: 0,
				lists_limit: 0,
				tags_limit: 0,
				query
			};
		}

		return new Promise((resolve, reject) => {
			axios.get(this.api_host+searchAllEndpoint, {headers: this._config().headers, params: filter})
			.then(r => {
				r.data.articles = r.data.articles || [];
				r.data.groups = r.data.groups || [];
				r.data.lists = r.data.lists || [];
				r.data.tags = r.data.tags || [];
				r.data.user = r.data.user || [];
				resolve(r.data);
			});
		});
	}

	getOrganization() {
		return new Promise((resolve, reject) => {
			axios.get(this.api_host+organizationEndpoint, {headers: this._config().headers})
			.then(r => {
				resolve(r.data);
			});
		});
	}

	getLanguages() {
		return new Promise((resolve, reject) => {
			axios.get(this.api_host+languagesEndpoint, {headers: this._config().headers})
			.then(r => {
				resolve(r.data);
			});
		});
	}

	getLanguage(id) {
		this._checkParamIsString(id);

		return new Promise((resolve, reject) => {
			axios.get(this.api_host+languageEndpoint.replace("{id}", id), {headers: this._config().headers})
			.then(r => {
				resolve(r.data);
			});
		});
	}

	getArticle(id, langId, version) {
		this._checkParamIsString(id);

		if(langId !== undefined && langId !== null) {
			this._checkParamIsString(langId, "langId");
		}

		if(version !== undefined && version !== null) {
			this._checkParamIsNumber(version, "version");
		}

		return new Promise((resolve, reject) => {
			axios.get(this.api_host+articleEndpoint.replace("{id}", id), {headers: this._config().headers, params: {lang: langId, version}})
			.then(r => {
				resolve(r.data);
			});
		});
	}

	getArticleHistory(id, langId, offset) {
		this._checkParamIsString(id);

		if(langId !== undefined && langId !== null) {
			this._checkParamIsString(langId, "langId");
		}

		if(offset !== undefined && offset !== null) {
			this._checkParamIsNumber(offset, "offset");
		}

		return new Promise((resolve, reject) => {
			axios.get(this.api_host+articleHistoryEndpoint.replace("{id}", id), {headers: this._config().headers, params: {lang: langId, offset}})
			.then(r => {
				resolve(r.data);
			});
		});
	}

	getPinned(articles, lists, offset_articles, offset_lists) {
		this._checkParamIsBoolean(articles, "articles");
		this._checkParamIsBoolean(lists, "lists");

		if(offset_articles !== undefined && offset_articles !== null) {
			this._checkParamIsNumber(offset_articles, "offset_articles");
		}

		if(offset_lists !== undefined && offset_lists !== null) {
			this._checkParamIsNumber(offset_lists, "offset_lists");
		}

		return new Promise((resolve, reject) => {
			axios.get(this.api_host+pinnedEndpoint, {headers: this._config().headers, params: {articles, lists, offset_articles, offset_lists}})
			.then(r => {
				resolve(r.data);
			});
		});
	}

	getList(id, langId) {
		this._checkParamIsString(id);

		if(langId !== undefined && langId !== null) {
			this._checkParamIsString(langId, "langId");
		}

		return new Promise((resolve, reject) => {
			axios.get(this.api_host+listEndpoint.replace("{id}", id), {headers: this._config().headers, params: {lang: langId}})
			.then(r => {
				resolve(r.data);
			});
		});
	}

	getListEntries(id, langId, filter) {
		filter = this._checkListEntriesParamsAndBuildFilter(id, langId, filter);

		return new Promise((resolve, reject) => {
			axios.get(this.api_host+listEntriesEndpoint.replace("{id}", id), {headers: this._config().headers, params: filter})
			.then(r => {
				r.data.entries = r.data.entries || [];
				resolve(r.data);
			});
		});
	}

	getTag(name) {
		this._checkParamIsString(name, "name");

		return new Promise((resolve, reject) => {
			axios.get(this.api_host+tagEndpoint.replace("{name}", name), {headers: this._config().headers})
			.then(r => {
				resolve(r.data);
			});
		});
	}

	_addAxiosInterceptor() {
		axios.interceptors.response.use(null, e => {
			if(e.config && e.response && e.response.status === 401) {
				return this.refreshToken()
				.then(() => {
					e.config.headers = this._config().headers;
					return axios.request(e.config);
				});
			}

			return Promise.reject(e);
		});
	}

	_checkSearchParamsAndBuildFilter(query, filter) {
		if(query !== undefined && query !== null) {
			this._checkParamIsString(query, "query");
		}

		if(filter === undefined || filter === null) {
			filter = {};
		}

		if(typeof filter !== "object") {
			throw new TypeError("filter must be of type object");
		}

		filter.query = query;
		return filter;
	}

	_checkListEntriesParamsAndBuildFilter(id, langId, filter) {
		this._checkParamIsString(id);

		if(langId !== undefined && langId !== null) {
			this._checkParamIsString(langId, "langId");
		}

		if(filter === undefined || filter === null) {
			filter = {};
		}

		if(typeof filter !== "object") {
			throw new TypeError("filter must be of type object");
		}

		filter.lang = langId;
		return filter;
	}

	_checkParamIsString(param, name) {
		if(typeof param !== "string") {
			throw new TypeError(`${name} must be of type string`);
		}
	}

	_checkParamIsNumber(param, name) {
		if(typeof param !== "number") {
			throw new TypeError(`${name} must be of type number`);
		}
	}

	_checkParamIsBoolean(param, name) {
		if(typeof param !== "boolean") {
			throw new TypeError(`${name} must be of type boolean`);
		}
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

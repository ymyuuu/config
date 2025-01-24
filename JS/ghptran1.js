(function() {
	'use strict';

	const DICT_URL =
		'/_raw/maboloshi/github-chinese/gh-pages/locals.js?v1.9.3-2025-01-19';
	const LANG = 'zh-CN';
	const STORAGE_KEY_REGEXP = 'github_chinese_enable_regexp';

	let enable_RegExp = (localStorage.getItem(STORAGE_KEY_REGEXP) === null) ?
		true :
		(localStorage.getItem(STORAGE_KEY_REGEXP) === 'true');

	let page = false;
	let cachedPage = null;
	let characterData = null;
	let ignoreMutationSelectors = [];
	let ignoreSelectors = [];
	let tranSelectors = [];
	let regexpRules = [];

	// 加载词典
	loadDictionary(DICT_URL).then(() => {
		init();
	}).catch(() => {
		// 这里不输出任何错误
	});

	async function loadDictionary(url) {
		const res = await fetch(url);
		if (!res.ok) return; // 不输出错误
		const scriptText = await res.text();
		window.eval(scriptText); // 生成 window.I18N
		if (!window.I18N) return; // 也不输出错误
	}

	function init() {
		document.documentElement.lang = LANG;
		new MutationObserver(() => {
			if (document.documentElement.lang === 'en') {
				document.documentElement.lang = LANG;
			}
		}).observe(document.documentElement, {
			attributeFilter: ['lang']
		});

		page = initPage();
		if (page) {
			traverseNode(document.body);
		}
		watchUpdate();

		document.addEventListener('turbo:load', () => {
			if (!page) return;
			transTitle();
			transBySelector();
			if (page === 'repository') {
				transDesc('.f4.my-3');
			} else if (page === 'gist') {
				transDesc('.gist-content [itemprop="about"]');
			}
		});
	}

	function initPage() {
		const p = getPage();
		updateConfig(p);
		return p;
	}

	function getPage(url = window.location) {
		if (!window.I18N || !window.I18N[LANG]) {
			return false; // 不输出警告
		}

		const siteMapping = {
			'gist.github.com': 'gist',
			'www.githubstatus.com': 'status',
			'skills.github.com': 'skills',
			'education.github.com': 'education',
		};
		const site = siteMapping[url.hostname] || 'github';
		const pathname = url.pathname;
		const isLogin = document.body.classList.contains('logged-in');
		const analyticsLocation = document.head.querySelector('meta[name="analytics-location"]')?.content || '';

		const isSession = document.body.classList.contains('session-authentication');

		const {
			rePagePathRepo,
			rePagePathOrg,
			rePagePath
		} = window.I18N.conf;
		let t, pageType = false;

		if (isSession) {
			pageType = 'session-authentication';
		} else if (site === 'gist' || site === 'status' || site === 'skills' || site === 'education') {
			pageType = site;
		} else if (isProfile) {
			t = url.search.match(/tab=([^&]+)/);
			pageType = t ? 'page-profile/' + t[1] : pathname.includes('/stars') ? 'page-profile/stars' :
				'page-profile';
		} else if (pathname === '/' && site === 'github') {
			pageType = isLogin ? 'page-dashboard' : 'homepage';
		} else if (isRepository) {
			t = pathname.match(rePagePathRepo);
			pageType = t ? 'repository/' + t[1] : 'repository';
		} else if (isOrganization) {
			t = pathname.match(rePagePathOrg);
			pageType = t ? 'orgs/' + (t[1] || t.slice(-1)[0]) : 'orgs';
		} else {
			t = pathname.match(rePagePath);
			pageType = t ? (t[1] || t.slice(-1)[0]) : false;
		}

		if (!pageType || !window.I18N[LANG][pageType]) {
			return false; // 不输出日志
		}
		return pageType;
	}

	function updateConfig(p) {
		if (cachedPage !== p && p) {
			cachedPage = p;
			const {
				characterDataPage,
				ignoreMutationSelectorPage,
				ignoreSelectorPage
			} = window.I18N.conf;
			characterData = characterDataPage.includes(p);
			ignoreMutationSelectors = ignoreMutationSelectorPage['*'].concat(ignoreMutationSelectorPage[p] || []);
			ignoreSelectors = ignoreSelectorPage['*'].concat(ignoreSelectorPage[p] || []);
			tranSelectors = (window.I18N[LANG][p]?.selector || []).concat(window.I18N[LANG]['public'].selector ||
			[]);
			regexpRules = (window.I18N[LANG][p].regexp || []).concat(window.I18N[LANG]['public'].regexp || []);
		}
	}

	function watchUpdate() {
		const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window
			.MozMutationObserver;
		let previousURL = location.href;

		new MutationObserver(mutations => {
			const currentURL = location.href;
			if (currentURL !== previousURL) {
				previousURL = currentURL;
				page = initPage();
			}
			if (page) {
				const filteredMutations = mutations.flatMap(({
					target,
					addedNodes,
					type
				}) => {
					let nodes = [];
					if (type === 'childList' && addedNodes.length > 0) {
						nodes = Array.from(addedNodes);
					} else if (type === 'attributes' || (characterData && type ===
							'characterData')) {
						nodes = [target];
					}
					return nodes.filter(node =>
						!ignoreMutationSelectors.some(selector => node.parentElement?.closest(
							selector))
					);
				});
				filteredMutations.forEach(node => traverseNode(node));
			}
		}).observe(document.body, {
			characterData: true,
			subtree: true,
			childList: true,
			attributeFilter: ['value', 'placeholder', 'aria-label', 'data-confirm', 'data-visible-text'],
		});
	}

	function traverseNode(node) {
		if (ignoreSelectors.some(sel => node.matches?.(sel))) return;

		if (node.nodeType === Node.ELEMENT_NODE) {
			switch (node.tagName) {
				case 'RELATIVE-TIME':
					transTimeElement(node.shadowRoot);
					watchTimeElement(node.shadowRoot);
					return;
				case 'INPUT':
				case 'TEXTAREA':
					if (['button', 'submit', 'reset'].includes(node.type)) {
						transElement(node.dataset, 'confirm');
						transElement(node, 'value');
					} else {
						transElement(node, 'placeholder');
					}
					break;
				case 'BUTTON':
					if (/tooltipped/.test(node.className)) transElement(node, 'ariaLabel');
					transElement(node, 'title');
					transElement(node.dataset, 'confirm');
					transElement(node.dataset, 'confirmText');
					transElement(node.dataset, 'confirmCancelText');
					transElement(node, 'cancelConfirmText');
					transElement(node.dataset, 'disableWith');
					break;
				case 'OPTGROUP':
					transElement(node, 'label');
					break;
				case 'A':
					transElement(node, 'title');
					transElement(node, 'ariaLabel');
					break;
				case 'SPAN':
					transElement(node, 'title');
					if (/tooltipped/.test(node.className)) transElement(node, 'ariaLabel');
					transElement(node.dataset, 'visibleText');
					break;
				default:
					if (/tooltipped/.test(node.className)) transElement(node, 'ariaLabel');
			}
			node.childNodes.forEach(child => traverseNode(child));
		} else if (node.nodeType === Node.TEXT_NODE && node.nodeValue.length <= 500) {
			transElement(node, 'data');
		}
	}

	function transTitle() {
		const text = document.title;
		const
			dictTitle = window.I18N[LANG]['title'];
		let translatedText = dictTitle['static'][text] || '';
		if (!translatedText) {
			const reArr = dictTitle.regexp || [];
			for (let [pattern, replacement] of reArr) {
				const newText = text.replace(pattern, replacement);
				if (newText !== text) {
					translatedText = newText;
					break;
				}
			}
		}
		if (translatedText) {
			document.title = translatedText;
		}
	}

	function transTimeElement(el) {
		if (!el) return;
		const text = el.childNodes.length > 0 ? el.lastChild.textContent : el.textContent;
		if (!text) return;
		const newText = text.replace(/^on/, '');
		if (newText !== text) {
			el.textContent = newText;
		}
	}

	function watchTimeElement(el) {
		if (!el) return;
		const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window
			.MozMutationObserver;
		new MutationObserver(mutations => {
			const node = mutations[0]?.addedNodes?.[0];
			if (node) transTimeElement(node);
		}).observe(el, {
			childList: true
		});
	}

	function transElement(el, field) {
		if (!el[field]) return;
		const text = el[field];
		const translatedText = transText(text);
		if (translatedText) {
			el[field] = translatedText;
		}
	}

	function transText(text) {
		if (/^[\\s0-9]*$/.test(text) || /^[\\u4e00-\\u9fa5]+$/.test(text) || !/[a-zA-Z,.]/.test(text)) {
			return false;
		}
		const trimmedText = text.trim();
		const cleanedText = trimmedText.replace(/\\xa0|[\\s]+/g, ' ');
		const result = fetchTranslatedText(cleanedText);
		if (result && result !== cleanedText) {
			return text.replace(trimmedText, result);
		}
		return false;
	}

	function fetchTranslatedText(text) {
		let translatedText = window.I18N[LANG][page]['static'][text] ||
			window.I18N[LANG]['public']['static'][text];
		if (typeof translatedText === 'string') {
			return translatedText;
		}
		if (enable_RegExp && regexpRules.length > 0) {
			for (let [pattern, replacement] of regexpRules) {
				const newText = text.replace(pattern, replacement);
				if (newText !== text) {
					return newText;
				}
			}
		}
		return false;
	}

	function transBySelector() {
		if (!tranSelectors || tranSelectors.length === 0) return;
		for (let [selector, newText] of tranSelectors) {
			const el = document.querySelector(selector);
			if (el) {
				el.textContent = newText;
			}
		}
	}

	window._toggleRegExpTranslation = function() {
		enable_RegExp = !enable_RegExp;
		localStorage.setItem(STORAGE_KEY_REGEXP, String(enable_RegExp));
		// 不输出任何日志
	};

})();

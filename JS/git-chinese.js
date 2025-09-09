(function() {
	'use strict';

	// 配置
	const CONFIG = {
		LANG: 'zh-CN',
		DICT_URL: '/raw-githubusercontent-com/maboloshi/github-chinese/refs/heads/gh-pages/locals.js',
		OBSERVER_CONFIG: {
			childList: true,
			subtree: true,
			characterData: true,
			attributeFilter: ['value', 'placeholder', 'aria-label', 'data-confirm']
		}
	};

	let I18N = null;
	let pageConfig = {};

	// 动态加载词典
	async function loadDictionary() {
		try {
			console.log('[GitHub中文化] 加载词典...');
			const response = await fetch(CONFIG.DICT_URL);
			const scriptText = await response.text();

			const script = document.createElement('script');
			script.textContent = scriptText;
			document.head.appendChild(script);
			document.head.removeChild(script);

			if (typeof window.I18N !== 'undefined') {
				I18N = window.I18N;
				console.log('[GitHub中文化] 词典加载成功');
				return true;
			}
		} catch (error) {
			console.error('[GitHub中文化] 词典加载失败:', error);
		}
		return false;
	}

	// 检测页面类型
	function detectPageType() {
		const {
			pathname
		} = window.location;
		const isLogin = document.body?.classList.contains("logged-in");
		const metaLocation = document.head.querySelector('meta[name="analytics-location"]')?.content || '';

		if (!I18N?.conf) return false;

		// 基础页面特征
		const isSession = document.body?.classList.contains("session-authentication");
		const isHomepage = pathname === '/';
		const isProfile = document.body?.classList.contains("page-profile") || metaLocation === '/<user-name>';
		const isRepository = /\/<user-name>\/<repo-name>/.test(metaLocation);
		const isOrganization = /\/<org-login>/.test(metaLocation) || /^\/(?:orgs|organizations)/.test(pathname);

		const {
			rePagePathRepo,
			rePagePathOrg,
			rePagePath
		} = I18N.conf;

		let pageType;
		switch (true) {
			case isSession:
				pageType = 'session-authentication';
				break;
			case isProfile:
				const tabParam = new URLSearchParams(window.location.search).get('tab');
				pageType = pathname.includes('/stars') ? 'page-profile/stars' :
					tabParam ? `page-profile/${tabParam}` :
					'page-profile';
				break;
			case isHomepage:
				pageType = isLogin ? 'dashboard' : 'homepage';
				break;
			case isRepository:
				const repoMatch = pathname.match(rePagePathRepo);
				pageType = repoMatch ? `repository/${repoMatch[1]}` : 'repository';
				break;
			case isOrganization:
				const orgMatch = pathname.match(rePagePathOrg);
				pageType = orgMatch ? `orgs/${orgMatch[1] || orgMatch.slice(-1)[0]}` : 'orgs';
				break;
			default:
				const pathMatch = pathname.match(rePagePath);
				pageType = pathMatch ? (pathMatch[1] || pathMatch.slice(-1)[0]) : false;
		}

		if (pageType && I18N[CONFIG.LANG]?.[pageType]) {
			console.log(`[GitHub中文化] 页面类型: ${pageType}`);
			return pageType;
		}

		return false;
	}

	// 构建页面配置
	function buildPageConfig(pageType) {
		if (!I18N || !pageType) return {};

		return {
			currentPageType: pageType,
			staticDict: {
				...I18N[CONFIG.LANG].public.static,
				...(I18N[CONFIG.LANG][pageType]?.static || {})
			},
			regexpRules: [
				...(I18N[CONFIG.LANG][pageType]?.regexp || []),
				...I18N[CONFIG.LANG].public.regexp
			],
			ignoreMutationSelectors: [
				...I18N.conf.ignoreMutationSelectorPage['*'],
				...(I18N.conf.ignoreMutationSelectorPage[pageType] || [])
			].join(', '),
			ignoreSelectors: [
				...I18N.conf.ignoreSelectorPage['*'],
				...(I18N.conf.ignoreSelectorPage[pageType] || [])
			].join(', '),
			characterData: I18N.conf.characterDataPage.includes(pageType),
			tranSelectors: [
				...(I18N[CONFIG.LANG].public.selector || []),
				...(I18N[CONFIG.LANG][pageType]?.selector || [])
			],
		};
	}

	// 更新页面配置
	function updatePageConfig() {
		const newType = detectPageType();
		if (newType && newType !== pageConfig.currentPageType) {
			pageConfig = buildPageConfig(newType);
		}
	}

	// 翻译文本
	function transText(text) {
		if (!text || !pageConfig.staticDict) return false;
		if (/^[\s0-9]*$/.test(text) || /^[\u4e00-\u9fa5]+$/.test(text) || !/[a-zA-Z,.]/.test(text)) {
			return false;
		}

		const trimmedText = text.trim();
		const cleanedText = trimmedText.replace(/\xa0|[\s]+/g, ' ');

		// 静态词典翻译
		let translatedText = pageConfig.staticDict[cleanedText];
		if (translatedText) {
			return text.replace(trimmedText, translatedText);
		}

		// 正则翻译
		for (const [pattern, replacement] of pageConfig.regexpRules) {
			translatedText = cleanedText.replace(pattern, replacement);
			if (translatedText !== cleanedText) {
				return text.replace(trimmedText, translatedText);
			}
		}

		return false;
	}

	// 翻译元素
	function transElement(el, field) {
		const text = el[field];
		if (!text) return false;

		const translatedText = transText(text);
		if (translatedText) {
			el[field] = translatedText;
			return true;
		}
		return false;
	}

	// 翻译时间元素
	function transTimeElement(el) {
		const text = el.childNodes.length > 0 ? el.lastChild.textContent : el.textContent;
		const translatedText = text.replace(/^on/, "");
		if (translatedText !== text) {
			el.textContent = translatedText;
		}
	}

	// 遍历节点进行翻译
	function traverseNode(rootNode) {
		if (!rootNode || !pageConfig.currentPageType) return;

		const start = performance.now();

		if (rootNode.nodeType === Node.TEXT_NODE) {
			if (rootNode.length <= 500) {
				transElement(rootNode, 'data');
			}
			return;
		}

		const treeWalker = document.createTreeWalker(
			rootNode,
			NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
			node => node.matches?.(pageConfig.ignoreSelectors) ? NodeFilter.FILTER_REJECT : NodeFilter
			.FILTER_ACCEPT
		);

		const handleElement = node => {
			switch (node.tagName) {
				case "RELATIVE-TIME":
					if (node.shadowRoot) transTimeElement(node.shadowRoot);
					break;
				case "INPUT":
				case "TEXTAREA":
					if (['button', 'submit', 'reset'].includes(node.type)) {
						transElement(node.dataset, 'confirm');
						transElement(node, 'value');
					} else {
						transElement(node, 'placeholder');
					}
					break;
				case "OPTGROUP":
					transElement(node, 'label');
					break;
				case "BUTTON":
					transElement(node, 'title');
					transElement(node.dataset, 'confirm');
					transElement(node.dataset, 'confirmText');
					transElement(node.dataset, 'confirmCancelText');
					transElement(node, 'cancelConfirmText');
					transElement(node.dataset, 'disableWith');
				case "A":
				case "SPAN":
					transElement(node, 'title');
					transElement(node.dataset, 'visibleText');
				default:
					if (/tooltipped/.test(node.className)) {
						transElement(node, 'ariaLabel');
					}
			}
		}

		let currentNode;
		while ((currentNode = treeWalker.nextNode())) {
			if (currentNode.nodeType === Node.ELEMENT_NODE) {
				handleElement(currentNode);
			} else if (currentNode.nodeType === Node.TEXT_NODE && currentNode.length <= 500) {
				transElement(currentNode, 'data');
			}
		}

		const duration = performance.now() - start;
		if (duration > 20) {
			console.log(`[GitHub中文化] 节点翻译耗时: ${duration.toFixed(2)}ms`);
		}
	}

	// 通过选择器翻译
	function transBySelector() {
		if (!pageConfig.tranSelectors) return;
		pageConfig.tranSelectors.forEach(([selector, translatedText]) => {
			const element = document.querySelector(selector);
			if (element) element.textContent = translatedText;
		});
	}

	// 翻译页面标题
	function transTitle() {
		if (!I18N?.[CONFIG.LANG]?.title) return;

		const text = document.title;
		let translatedText = I18N[CONFIG.LANG]['title']['static'][text];

		if (!translatedText) {
			const regexRules = I18N[CONFIG.LANG]['title'].regexp || [];
			for (const [pattern, replacement] of regexRules) {
				translatedText = text.replace(pattern, replacement);
				if (translatedText !== text) break;
			}
		}

		if (translatedText) {
			document.title = translatedText;
		}
	}

	// 监控页面变化
	function watchUpdate() {
		let previousURL = window.location.href;

		const processMutations = mutations => {
			const currentURL = window.location.href;
			if (currentURL !== previousURL) {
				previousURL = currentURL;
				updatePageConfig();
			}

			if (!pageConfig.currentPageType) return;

			mutations.flatMap(({
					target,
					addedNodes,
					type
				}) => {
					if (type === 'childList' && addedNodes.length > 0) {
						return [...addedNodes];
					}
					return (type === 'attributes' || (type === 'characterData' && pageConfig
						.characterData)) ? [target] : [];
				})
				.filter(node =>
					node.parentElement && !node.parentElement.closest(pageConfig.ignoreMutationSelectors)
				)
				.forEach(node => traverseNode(node));
		}

		const observer = new MutationObserver(processMutations);

		const startObserver = () => {
			if (document.body) {
				observer.observe(document.body, CONFIG.OBSERVER_CONFIG);
			} else {
				setTimeout(startObserver, 100);
			}
		};

		startObserver();
	}

	// 初始化
	async function init() {
		document.documentElement.lang = CONFIG.LANG;

		const dictLoaded = await loadDictionary();
		if (!dictLoaded) return;

		const initTranslation = () => {
			updatePageConfig();
			if (pageConfig.currentPageType) {
				traverseNode(document.body);
				transTitle();
				transBySelector();
				console.log('[GitHub中文化] 初始化完成');
			}
		};

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', initTranslation);
		} else {
			initTranslation();
		}

		document.addEventListener('turbo:load', () => {
			if (pageConfig.currentPageType) {
				transTitle();
				transBySelector();
			}
		});

		new MutationObserver(() => {
			if (document.documentElement.lang === "en") {
				document.documentElement.lang = CONFIG.LANG;
			}
		}).observe(document.documentElement, {
			attributeFilter: ['lang']
		});

		watchUpdate();
	}

	init();
})();

/**
 * Lean Headless Meta Collection for Juris SSR
 * Zero addition to main framework - pure headless component
 */

// Standalone Meta Collection Headless Component
const MetaManager = (props, context) => {
	const isSSR = typeof window === 'undefined';
	const meta = new Map();
	const defaults = props.defaults || {};

	// Initialize with defaults
	Object.entries(defaults).forEach(([key, value]) => {
		meta.set(key, normalizeMetaValue(key, value));
	});

	// Normalize meta value to object format
	function normalizeMetaValue(key, value) {
		if (typeof value === 'object' && value !== null) {
			return value;
		}

		// String shorthand handling
		if (key === 'title') {
			return { title: value };
		}

		// OpenGraph properties
		if (key.startsWith('og:') || key.startsWith('twitter:') || key.startsWith('article:')) {
			return { property: key, content: value };
		}

		// Standard meta tags
		return { name: key, content: value };
	}

	// HTML escape utility
	function escape(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	// Generate HTML string from meta object
	function metaToHTML(metaObj) {
		if (metaObj.title) {
			return `<title>${escape(metaObj.title)}</title>`;
		}

		if (metaObj.property) {
			return `<meta property="${escape(metaObj.property)}" content="${escape(metaObj.content)}">`;
		}

		if (metaObj.name) {
			return `<meta name="${escape(metaObj.name)}" content="${escape(metaObj.content)}">`;
		}

		// Custom attributes
		const attrs = Object.entries(metaObj)
			.map(([key, value]) => `${key}="${escape(value)}"`)
			.join(' ');
		return `<meta ${attrs}>`;
	}

	return {
		api: {
			// Set single meta tag
			set(key, value) {
				if (value === null || value === undefined) {
					meta.delete(key);
				} else {
					meta.set(key, normalizeMetaValue(key, value));
				}
				return this;
			},

			// Set multiple meta tags
			setMeta(metaObject) {
				Object.entries(metaObject).forEach(([key, value]) => {
					this.set(key, value);
				});
				return this;
			},

			// Get single meta value
			get(key) {
				return meta.get(key);
			},

			// Get all collected meta as object
			getAll() {
				return Object.fromEntries(meta);
			},

			// Get all meta as HTML string (perfect for SSR)
			getHTML() {
				if (!isSSR) return ''; // No-op on client

				const tags = [];
				meta.forEach((metaObj, key) => {
					tags.push(metaToHTML(metaObj));
				});
				return tags.join('\n');
			},

			// Get specific meta types
			getTitles() {
				const titles = [];
				meta.forEach((metaObj, key) => {
					if (metaObj.title) titles.push(metaObj);
				});
				return titles;
			},

			getOpenGraph() {
				const og = {};
				meta.forEach((metaObj, key) => {
					if (metaObj.property && metaObj.property.startsWith('og:')) {
						og[metaObj.property] = metaObj.content;
					}
				});
				return og;
			},

			getTwitterCard() {
				const twitter = {};
				meta.forEach((metaObj, key) => {
					if (metaObj.property && metaObj.property.startsWith('twitter:')) {
						twitter[metaObj.property] = metaObj.content;
					}
				});
				return twitter;
			},

			// Clear specific meta
			clear(key) {
				meta.delete(key);
				return this;
			},

			// Reset all meta
			reset() {
				meta.clear();
				return this;
			},

			// Bulk update with merge
			update(metaObject) {
				this.setMeta(metaObject);
				return this;
			},

			// Check if meta exists
			has(key) {
				return meta.has(key);
			},

			// Get meta count
			count() {
				return meta.size;
			},

			// Export for serialization
			serialize() {
				return JSON.stringify(Object.fromEntries(meta));
			},

			// Import from serialized data
			deserialize(jsonString) {
				try {
					const data = JSON.parse(jsonString);
					this.setMeta(data);
				} catch (error) {
					console.warn('Failed to deserialize meta data:', error);
				}
				return this;
			}
		},

		hooks: {
			onRegister() {
				console.debug('MetaManager registered with', meta.size, 'default tags');
			}
		}
	};
};
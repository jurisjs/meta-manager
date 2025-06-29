/**
 * Enhanced Non-Blocking MetaManager for Juris - SSR/Client Aware
 * Uses isSSR context flag, supports title segments, and ensures non-blocking operations
 */

// Enhanced Non-Blocking Meta Collection Headless Component
const MetaManager = (props, context) => {
	const { isSSR, getState, setState } = context;
	const meta = new Map();
	const defaults = props.defaults || {};
	const titleSeparator = props.titleSeparator || ' | ';

	// Use global promisify utility
	const promisifyUtil = (typeof window !== 'undefined' ? window.promisify :
		typeof global !== 'undefined' ? global.promisify :
			(value) => Promise.resolve(value));

	// Initialize with defaults (non-blocking)
	setTimeout(() => {
		Object.entries(defaults).forEach(([key, value]) => {
			meta.set(key, normalizeMetaValue(key, value));
		});
	}, 0);

	// Client-side DOM cache for performance
	const domCache = isSSR ? null : new Map();

	// Non-blocking operation queue for client-side DOM updates
	const operationQueue = [];
	let isProcessing = false;

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

	// Non-blocking queue processor for DOM operations
	function processOperationQueue() {
		if (isProcessing || operationQueue.length === 0) return;

		isProcessing = true;

		// Process operations in next tick
		setTimeout(() => {
			try {
				const batchSize = Math.min(5, operationQueue.length); // Process max 5 operations per tick
				const operations = operationQueue.splice(0, batchSize);

				operations.forEach(operation => {
					try {
						operation();
					} catch (error) {
						console.warn('Meta operation failed:', error);
					}
				});

				isProcessing = false;

				// Continue processing if more operations exist
				if (operationQueue.length > 0) {
					processOperationQueue();
				}
			} catch (error) {
				console.warn('Queue processing failed:', error);
				isProcessing = false;
			}
		}, 0);
	}

	// Queue DOM operation for non-blocking execution
	function queueDOMOperation(operation) {
		if (isSSR) return; // Skip on server

		operationQueue.push(operation);
		processOperationQueue();
	}

	// Client-side DOM manipulation (non-blocking)
	function updateDOMTag(key, metaObj) {
		if (isSSR) return Promise.resolve(); // Skip on server

		return new Promise((resolve) => {
			queueDOMOperation(() => {
				try {
					// Handle title tags
					if (metaObj.title) {
						document.title = metaObj.title;
						resolve();
						return;
					}

					// Handle meta tags
					const selector = metaObj.property
						? `meta[property="${metaObj.property}"]`
						: `meta[name="${metaObj.name}"]`;

					let element = document.querySelector(selector);

					if (!element) {
						element = document.createElement('meta');
						if (metaObj.property) {
							element.setAttribute('property', metaObj.property);
						} else {
							element.setAttribute('name', metaObj.name);
						}
						document.head.appendChild(element);
					}

					element.setAttribute('content', metaObj.content);

					// Cache for performance
					domCache.set(key, element);
					resolve();

				} catch (error) {
					console.warn('Failed to update DOM meta tag:', error);
					resolve(); // Always resolve to prevent hanging
				}
			});
		});
	}

	// Remove DOM tag (non-blocking)
	function removeDOMTag(key) {
		if (isSSR) return Promise.resolve();

		return new Promise((resolve) => {
			queueDOMOperation(() => {
				try {
					const element = domCache.get(key);
					if (element && element.parentNode) {
						element.parentNode.removeChild(element);
						domCache.delete(key);
					}
					resolve();
				} catch (error) {
					console.warn('Failed to remove DOM meta tag:', error);
					resolve(); // Always resolve
				}
			});
		});
	}

	// Title segment management (non-blocking)
	function buildTitle() {
		return promisifyUtil(new Promise((resolve) => {
			// Non-blocking title building
			setTimeout(() => {
				try {
					const main = getState('ui.title.main', '');
					const segments = [];

					// Collect segments in order
					let segmentIndex = 1;
					while (true) {
						const segment = getState(`ui.title.segment${segmentIndex}`, null);
						if (segment === null) break;
						if (segment.trim()) segments.push(segment);
						segmentIndex++;
					}

					// Build final title
					const titleParts = [main, ...segments].filter(Boolean);
					resolve(titleParts.join(titleSeparator));
				} catch (error) {
					console.warn('Title building failed:', error);
					resolve(''); // Fallback to empty string
				}
			}, 0);
		}));
	}

	// Update title based on segments (non-blocking)
	function updateTitle() {
		return buildTitle().then(fullTitle => {
			if (fullTitle) {
				const titleObj = { title: fullTitle };
				meta.set('title', titleObj);
				return updateDOMTag('title', titleObj);
			}
			return Promise.resolve();
		}).catch(error => {
			console.warn('Title update failed:', error);
			return Promise.resolve();
		});
	}

	// Non-blocking subscription setup
	if (!isSSR) {
		// Client-side: watch for title segment changes (non-blocking)
		setTimeout(() => {
			const titlePaths = ['ui.title.main'];
			for (let i = 1; i <= 10; i++) { // Support up to 10 segments
				titlePaths.push(`ui.title.segment${i}`);
			}

			titlePaths.forEach(path => {
				try {
					context.subscribe(path, () => {
						// Non-blocking title update
						updateTitle().catch(error => {
							console.warn('Reactive title update failed:', error);
						});
					});
				} catch (error) {
					console.warn('Failed to subscribe to title path:', path, error);
				}
			});
		}, 0);
	}

	return {
		api: {
			// Set single meta tag (non-blocking)
			set(key, value) {
				return promisifyUtil(new Promise((resolve) => {
					setTimeout(() => {
						try {
							if (value === null || value === undefined) {
								meta.delete(key);
								if (!isSSR) {
									removeDOMTag(key).then(() => resolve(this));
								} else {
									resolve(this);
								}
							} else {
								const metaObj = normalizeMetaValue(key, value);
								meta.set(key, metaObj);

								// Client-side: non-blocking DOM update
								if (!isSSR) {
									updateDOMTag(key, metaObj).then(() => resolve(this));
								} else {
									resolve(this);
								}
							}
						} catch (error) {
							console.warn('Meta set failed:', error);
							resolve(this); // Always resolve
						}
					}, 0);
				}));
			},

			// Set multiple meta tags (non-blocking)
			setMeta(metaObject) {
				const promises = Object.entries(metaObject).map(([key, value]) =>
					this.set(key, value)
				);

				return promisifyUtil(Promise.all(promises).then(() => this));
			},

			// Title segment management (non-blocking)
			setTitle(main, segments = []) {
				return promisifyUtil(new Promise((resolve) => {
					setTimeout(() => {
						try {
							// Store in state for reactivity
							setState('ui.title.main', main);

							// Clear existing segments
							let segmentIndex = 1;
							while (getState(`ui.title.segment${segmentIndex}`, null) !== null) {
								setState(`ui.title.segment${segmentIndex}`, null);
								segmentIndex++;
							}

							// Set new segments
							segments.forEach((segment, index) => {
								setState(`ui.title.segment${index + 1}`, segment);
							});

							// Update title (non-blocking)
							updateTitle().then(() => resolve(this));
						} catch (error) {
							console.warn('Set title failed:', error);
							resolve(this);
						}
					}, 0);
				}));
			},

			// Add title segment (non-blocking)
			addTitleSegment(segment) {
				return promisifyUtil(new Promise((resolve) => {
					setTimeout(() => {
						try {
							let segmentIndex = 1;
							while (getState(`ui.title.segment${segmentIndex}`, null) !== null) {
								segmentIndex++;
							}
							setState(`ui.title.segment${segmentIndex}`, segment);
							updateTitle().then(() => resolve(this));
						} catch (error) {
							console.warn('Add title segment failed:', error);
							resolve(this);
						}
					}, 0);
				}));
			},

			// Remove title segment (non-blocking)
			removeTitleSegment(index) {
				return promisifyUtil(new Promise((resolve) => {
					setTimeout(() => {
						try {
							setState(`ui.title.segment${index}`, null);

							// Compact segments (remove gaps)
							const segments = [];
							let segmentIndex = 1;
							while (true) {
								const segment = getState(`ui.title.segment${segmentIndex}`, null);
								if (segment === null) break;
								if (segment.trim()) segments.push(segment);
								setState(`ui.title.segment${segmentIndex}`, null);
								segmentIndex++;
							}

							// Reassign segments
							segments.forEach((segment, idx) => {
								setState(`ui.title.segment${idx + 1}`, segment);
							});

							updateTitle().then(() => resolve(this));
						} catch (error) {
							console.warn('Remove title segment failed:', error);
							resolve(this);
						}
					}, 0);
				}));
			},

			// Get title segments (non-blocking)
			getTitleSegments() {
				return promisifyUtil(new Promise((resolve) => {
					setTimeout(() => {
						try {
							const main = getState('ui.title.main', '');
							const segments = [];

							let segmentIndex = 1;
							while (true) {
								const segment = getState(`ui.title.segment${segmentIndex}`, null);
								if (segment === null) break;
								segments.push(segment);
								segmentIndex++;
							}

							buildTitle().then(full => {
								resolve({ main, segments, full });
							});
						} catch (error) {
							console.warn('Get title segments failed:', error);
							resolve({ main: '', segments: [], full: '' });
						}
					}, 0);
				}));
			},

			// Synchronous getters for immediate access
			get(key) {
				return meta.get(key);
			},

			getAll() {
				return Object.fromEntries(meta);
			},

			// Get all meta as HTML string (SSR only, non-blocking)
			getHTML() {
				if (!isSSR) {
					console.warn('getHTML() should only be called server-side');
					return '';
				}

				return promisifyUtil(new Promise((resolve) => {
					setTimeout(() => {
						try {
							const tags = [];
							meta.forEach((metaObj, key) => {
								tags.push(metaToHTML(metaObj));
							});
							resolve(tags.join('\n'));
						} catch (error) {
							console.warn('HTML generation failed:', error);
							resolve('');
						}
					}, 0);
				}));
			},

			// Synchronous specialized getters
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

			// Clear specific meta (non-blocking)
			clear(key) {
				return this.set(key, null);
			},

			// Reset all meta (non-blocking)
			reset() {
				return promisifyUtil(new Promise((resolve) => {
					setTimeout(() => {
						try {
							if (!isSSR) {
								// Clear DOM elements (non-blocking)
								const clearPromises = [];
								domCache.forEach((element, key) => {
									clearPromises.push(removeDOMTag(key));
								});

								Promise.all(clearPromises).then(() => {
									domCache.clear();
									meta.clear();
									resolve(this);
								});
							} else {
								meta.clear();
								resolve(this);
							}
						} catch (error) {
							console.warn('Reset failed:', error);
							resolve(this);
						}
					}, 0);
				}));
			},

			// Bulk update with merge (non-blocking)
			update(metaObject) {
				return this.setMeta(metaObject);
			},

			// Synchronous utility methods
			has(key) {
				return meta.has(key);
			},

			count() {
				return meta.size;
			},

			getEnvironment() {
				return {
					isSSR,
					titleSeparator,
					domCacheSize: isSSR ? 0 : domCache.size,
					queueSize: operationQueue.length
				};
			},

			// Export for serialization (non-blocking)
			serialize() {
				return promisifyUtil(new Promise((resolve) => {
					setTimeout(() => {
						try {
							this.getTitleSegments().then(titleInfo => {
								resolve(JSON.stringify({
									meta: Object.fromEntries(meta),
									title: titleInfo
								}));
							});
						} catch (error) {
							console.warn('Serialization failed:', error);
							resolve('{}');
						}
					}, 0);
				}));
			},

			// Import from serialized data (non-blocking)
			deserialize(jsonString) {
				return promisifyUtil(new Promise((resolve) => {
					setTimeout(() => {
						try {
							const data = JSON.parse(jsonString);
							const promises = [];

							if (data.meta) {
								promises.push(this.setMeta(data.meta));
							}

							if (data.title) {
								promises.push(this.setTitle(data.title.main, data.title.segments));
							}

							Promise.all(promises).then(() => resolve(this));
						} catch (error) {
							console.warn('Failed to deserialize meta data:', error);
							resolve(this);
						}
					}, 0);
				}));
			}
		},

		hooks: {
			onRegister() {
				// Non-blocking registration
				setTimeout(() => {
					console.debug(`MetaManager registered (${isSSR ? 'SSR' : 'Client'}) with ${meta.size} default tags`);

					// Initialize title from state if exists (non-blocking)
					if (!isSSR) {
						updateTitle().catch(error => {
							console.warn('Initial title update failed:', error);
						});
					}
				}, 0);
			},

			onUnregister() {
				// Non-blocking cleanup
				setTimeout(() => {
					if (!isSSR) {
						// Clean up DOM elements
						domCache.forEach((element, key) => {
							queueDOMOperation(() => {
								if (element.parentNode) {
									element.parentNode.removeChild(element);
								}
							});
						});
						domCache.clear();
					}
					operationQueue.length = 0; // Clear queue
				}, 0);
			}
		}
	};
};
// Export the MetaManager component
if (typeof window !== 'undefined') {
	window.MetaManager = MetaManager;
} else {
	module.exports = MetaManager;
}
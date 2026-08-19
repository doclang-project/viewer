(function() {
	//#region \0rolldown/runtime.js
	var __defProp = Object.defineProperty;
	var __esmMin = (fn, res, err) => () => {
		if (err) throw err[0];
		try {
			return fn && (res = fn(fn = 0)), res;
		} catch (e) {
			throw err = [e], e;
		}
	};
	var __exportAll = (all, no_symbols) => {
		let target = {};
		for (var name in all) __defProp(target, name, {
			get: all[name],
			enumerable: true
		});
		if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
		return target;
	};
	//#endregion
	//#region node_modules/@lit/reactive-element/css-tag.js
	/**
	* @license
	* Copyright 2019 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/
	var t$4 = globalThis;
	var e$7 = t$4.ShadowRoot && (void 0 === t$4.ShadyCSS || t$4.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
	var s$4 = Symbol();
	var o$8 = /* @__PURE__ */ new WeakMap();
	var n$7 = class {
		constructor(t, e, o) {
			if (this._$cssResult$ = !0, o !== s$4) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
			this.cssText = t, this.t = e;
		}
		get styleSheet() {
			let t = this.o;
			const s = this.t;
			if (e$7 && void 0 === t) {
				const e = void 0 !== s && 1 === s.length;
				e && (t = o$8.get(s)), void 0 === t && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), e && o$8.set(s, t));
			}
			return t;
		}
		toString() {
			return this.cssText;
		}
	};
	var r$6 = (t) => new n$7("string" == typeof t ? t : t + "", void 0, s$4);
	var S$1 = (s, o) => {
		if (e$7) s.adoptedStyleSheets = o.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
		else for (const e of o) {
			const o = document.createElement("style"), n = t$4.litNonce;
			void 0 !== n && o.setAttribute("nonce", n), o.textContent = e.cssText, s.appendChild(o);
		}
	};
	var c$5 = e$7 ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((t) => {
		let e = "";
		for (const s of t.cssRules) e += s.cssText;
		return r$6(e);
	})(t) : t;
	//#endregion
	//#region node_modules/@lit/reactive-element/reactive-element.js
	/**
	* @license
	* Copyright 2017 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/ var { is: i$5, defineProperty: e$6, getOwnPropertyDescriptor: h$4, getOwnPropertyNames: r$5, getOwnPropertySymbols: o$7, getPrototypeOf: n$6 } = Object, a$1 = globalThis, c$4 = a$1.trustedTypes, l$2 = c$4 ? c$4.emptyScript : "", p$2 = a$1.reactiveElementPolyfillSupport, d$2 = (t, s) => t, u$3 = {
		toAttribute(t, s) {
			switch (s) {
				case Boolean:
					t = t ? l$2 : null;
					break;
				case Object:
				case Array: t = null == t ? t : JSON.stringify(t);
			}
			return t;
		},
		fromAttribute(t, s) {
			let i = t;
			switch (s) {
				case Boolean:
					i = null !== t;
					break;
				case Number:
					i = null === t ? null : Number(t);
					break;
				case Object:
				case Array: try {
					i = JSON.parse(t);
				} catch (t) {
					i = null;
				}
			}
			return i;
		}
	}, f$3 = (t, s) => !i$5(t, s), b$1 = {
		attribute: !0,
		type: String,
		converter: u$3,
		reflect: !1,
		useDefault: !1,
		hasChanged: f$3
	};
	Symbol.metadata ??= Symbol("metadata"), a$1.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
	var y$1 = class extends HTMLElement {
		static addInitializer(t) {
			this._$Ei(), (this.l ??= []).push(t);
		}
		static get observedAttributes() {
			return this.finalize(), this._$Eh && [...this._$Eh.keys()];
		}
		static createProperty(t, s = b$1) {
			if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(t, s), !s.noAccessor) {
				const i = Symbol(), h = this.getPropertyDescriptor(t, i, s);
				void 0 !== h && e$6(this.prototype, t, h);
			}
		}
		static getPropertyDescriptor(t, s, i) {
			const { get: e, set: r } = h$4(this.prototype, t) ?? {
				get() {
					return this[s];
				},
				set(t) {
					this[s] = t;
				}
			};
			return {
				get: e,
				set(s) {
					const h = e?.call(this);
					r?.call(this, s), this.requestUpdate(t, h, i);
				},
				configurable: !0,
				enumerable: !0
			};
		}
		static getPropertyOptions(t) {
			return this.elementProperties.get(t) ?? b$1;
		}
		static _$Ei() {
			if (this.hasOwnProperty(d$2("elementProperties"))) return;
			const t = n$6(this);
			t.finalize(), void 0 !== t.l && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
		}
		static finalize() {
			if (this.hasOwnProperty(d$2("finalized"))) return;
			if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(d$2("properties"))) {
				const t = this.properties, s = [...r$5(t), ...o$7(t)];
				for (const i of s) this.createProperty(i, t[i]);
			}
			const t = this[Symbol.metadata];
			if (null !== t) {
				const s = litPropertyMetadata.get(t);
				if (void 0 !== s) for (const [t, i] of s) this.elementProperties.set(t, i);
			}
			this._$Eh = /* @__PURE__ */ new Map();
			for (const [t, s] of this.elementProperties) {
				const i = this._$Eu(t, s);
				void 0 !== i && this._$Eh.set(i, t);
			}
			this.elementStyles = this.finalizeStyles(this.styles);
		}
		static finalizeStyles(s) {
			const i = [];
			if (Array.isArray(s)) {
				const e = new Set(s.flat(1 / 0).reverse());
				for (const s of e) i.unshift(c$5(s));
			} else void 0 !== s && i.push(c$5(s));
			return i;
		}
		static _$Eu(t, s) {
			const i = s.attribute;
			return !1 === i ? void 0 : "string" == typeof i ? i : "string" == typeof t ? t.toLowerCase() : void 0;
		}
		constructor() {
			super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
		}
		_$Ev() {
			this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
		}
		addController(t) {
			(this._$EO ??= /* @__PURE__ */ new Set()).add(t), void 0 !== this.renderRoot && this.isConnected && t.hostConnected?.();
		}
		removeController(t) {
			this._$EO?.delete(t);
		}
		_$E_() {
			const t = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
			for (const i of s.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
			t.size > 0 && (this._$Ep = t);
		}
		createRenderRoot() {
			const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
			return S$1(t, this.constructor.elementStyles), t;
		}
		connectedCallback() {
			this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
		}
		enableUpdating(t) {}
		disconnectedCallback() {
			this._$EO?.forEach((t) => t.hostDisconnected?.());
		}
		attributeChangedCallback(t, s, i) {
			this._$AK(t, i);
		}
		_$ET(t, s) {
			const i = this.constructor.elementProperties.get(t), e = this.constructor._$Eu(t, i);
			if (void 0 !== e && !0 === i.reflect) {
				const h = (void 0 !== i.converter?.toAttribute ? i.converter : u$3).toAttribute(s, i.type);
				this._$Em = t, null == h ? this.removeAttribute(e) : this.setAttribute(e, h), this._$Em = null;
			}
		}
		_$AK(t, s) {
			const i = this.constructor, e = i._$Eh.get(t);
			if (void 0 !== e && this._$Em !== e) {
				const t = i.getPropertyOptions(e), h = "function" == typeof t.converter ? { fromAttribute: t.converter } : void 0 !== t.converter?.fromAttribute ? t.converter : u$3;
				this._$Em = e;
				const r = h.fromAttribute(s, t.type);
				this[e] = r ?? this._$Ej?.get(e) ?? r, this._$Em = null;
			}
		}
		requestUpdate(t, s, i, e = !1, h) {
			if (void 0 !== t) {
				const r = this.constructor;
				if (!1 === e && (h = this[t]), i ??= r.getPropertyOptions(t), !((i.hasChanged ?? f$3)(h, s) || i.useDefault && i.reflect && h === this._$Ej?.get(t) && !this.hasAttribute(r._$Eu(t, i)))) return;
				this.C(t, s, i);
			}
			!1 === this.isUpdatePending && (this._$ES = this._$EP());
		}
		C(t, s, { useDefault: i, reflect: e, wrapped: h }, r) {
			i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, r ?? s ?? this[t]), !0 !== h || void 0 !== r) || (this._$AL.has(t) || (this.hasUpdated || i || (s = void 0), this._$AL.set(t, s)), !0 === e && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
		}
		async _$EP() {
			this.isUpdatePending = !0;
			try {
				await this._$ES;
			} catch (t) {
				Promise.reject(t);
			}
			const t = this.scheduleUpdate();
			return null != t && await t, !this.isUpdatePending;
		}
		scheduleUpdate() {
			return this.performUpdate();
		}
		performUpdate() {
			if (!this.isUpdatePending) return;
			if (!this.hasUpdated) {
				if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
					for (const [t, s] of this._$Ep) this[t] = s;
					this._$Ep = void 0;
				}
				const t = this.constructor.elementProperties;
				if (t.size > 0) for (const [s, i] of t) {
					const { wrapped: t } = i, e = this[s];
					!0 !== t || this._$AL.has(s) || void 0 === e || this.C(s, void 0, i, e);
				}
			}
			let t = !1;
			const s = this._$AL;
			try {
				t = this.shouldUpdate(s), t ? (this.willUpdate(s), this._$EO?.forEach((t) => t.hostUpdate?.()), this.update(s)) : this._$EM();
			} catch (s) {
				throw t = !1, this._$EM(), s;
			}
			t && this._$AE(s);
		}
		willUpdate(t) {}
		_$AE(t) {
			this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
		}
		_$EM() {
			this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
		}
		get updateComplete() {
			return this.getUpdateComplete();
		}
		getUpdateComplete() {
			return this._$ES;
		}
		shouldUpdate(t) {
			return !0;
		}
		update(t) {
			this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
		}
		updated(t) {}
		firstUpdated(t) {}
	};
	y$1.elementStyles = [], y$1.shadowRootOptions = { mode: "open" }, y$1[d$2("elementProperties")] = /* @__PURE__ */ new Map(), y$1[d$2("finalized")] = /* @__PURE__ */ new Map(), p$2?.({ ReactiveElement: y$1 }), (a$1.reactiveElementVersions ??= []).push("2.1.2");
	//#endregion
	//#region node_modules/lit-html/lit-html.js
	/**
	* @license
	* Copyright 2017 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/
	var t$3 = globalThis;
	var i$4 = (t) => t;
	var s$3 = t$3.trustedTypes;
	var e$5 = s$3 ? s$3.createPolicy("lit-html", { createHTML: (t) => t }) : void 0;
	var h$3 = "$lit$";
	var o$6 = `lit$${Math.random().toFixed(9).slice(2)}$`;
	var n$5 = "?" + o$6;
	var r$4 = `<${n$5}>`;
	var l$1 = document;
	var c$3 = () => l$1.createComment("");
	var a = (t) => null === t || "object" != typeof t && "function" != typeof t;
	var u$2 = Array.isArray;
	var d$1 = (t) => u$2(t) || "function" == typeof t?.[Symbol.iterator];
	var f$2 = "[ 	\n\f\r]";
	var v$1 = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
	var _ = /-->/g;
	var m$1 = />/g;
	var p$1 = RegExp(`>|${f$2}(?:([^\\s"'>=/]+)(${f$2}*=${f$2}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g");
	var g = /'/g;
	var $ = /"/g;
	var y = /^(?:script|style|textarea|title)$/i;
	var x = (t) => (i, ...s) => ({
		_$litType$: t,
		strings: i,
		values: s
	});
	var b = x(1);
	var E = Symbol.for("lit-noChange");
	var A = Symbol.for("lit-nothing");
	var C = /* @__PURE__ */ new WeakMap();
	var P = l$1.createTreeWalker(l$1, 129);
	function V(t, i) {
		if (!u$2(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
		return void 0 !== e$5 ? e$5.createHTML(i) : i;
	}
	var N = (t, i) => {
		const s = t.length - 1, e = [];
		let n, l = 2 === i ? "<svg>" : 3 === i ? "<math>" : "", c = v$1;
		for (let i = 0; i < s; i++) {
			const s = t[i];
			let a, u, d = -1, f = 0;
			for (; f < s.length && (c.lastIndex = f, u = c.exec(s), null !== u);) f = c.lastIndex, c === v$1 ? "!--" === u[1] ? c = _ : void 0 !== u[1] ? c = m$1 : void 0 !== u[2] ? (y.test(u[2]) && (n = RegExp("</" + u[2], "g")), c = p$1) : void 0 !== u[3] && (c = p$1) : c === p$1 ? ">" === u[0] ? (c = n ?? v$1, d = -1) : void 0 === u[1] ? d = -2 : (d = c.lastIndex - u[2].length, a = u[1], c = void 0 === u[3] ? p$1 : "\"" === u[3] ? $ : g) : c === $ || c === g ? c = p$1 : c === _ || c === m$1 ? c = v$1 : (c = p$1, n = void 0);
			const x = c === p$1 && t[i + 1].startsWith("/>") ? " " : "";
			l += c === v$1 ? s + r$4 : d >= 0 ? (e.push(a), s.slice(0, d) + h$3 + s.slice(d) + o$6 + x) : s + o$6 + (-2 === d ? i : x);
		}
		return [V(t, l + (t[s] || "<?>") + (2 === i ? "</svg>" : 3 === i ? "</math>" : "")), e];
	};
	var S = class S {
		constructor({ strings: t, _$litType$: i }, e) {
			let r;
			this.parts = [];
			let l = 0, a = 0;
			const u = t.length - 1, d = this.parts, [f, v] = N(t, i);
			if (this.el = S.createElement(f, e), P.currentNode = this.el.content, 2 === i || 3 === i) {
				const t = this.el.content.firstChild;
				t.replaceWith(...t.childNodes);
			}
			for (; null !== (r = P.nextNode()) && d.length < u;) {
				if (1 === r.nodeType) {
					if (r.hasAttributes()) for (const t of r.getAttributeNames()) if (t.endsWith(h$3)) {
						const i = v[a++], s = r.getAttribute(t).split(o$6), e = /([.?@])?(.*)/.exec(i);
						d.push({
							type: 1,
							index: l,
							name: e[2],
							strings: s,
							ctor: "." === e[1] ? I : "?" === e[1] ? L : "@" === e[1] ? z : H
						}), r.removeAttribute(t);
					} else t.startsWith(o$6) && (d.push({
						type: 6,
						index: l
					}), r.removeAttribute(t));
					if (y.test(r.tagName)) {
						const t = r.textContent.split(o$6), i = t.length - 1;
						if (i > 0) {
							r.textContent = s$3 ? s$3.emptyScript : "";
							for (let s = 0; s < i; s++) r.append(t[s], c$3()), P.nextNode(), d.push({
								type: 2,
								index: ++l
							});
							r.append(t[i], c$3());
						}
					}
				} else if (8 === r.nodeType) if (r.data === n$5) d.push({
					type: 2,
					index: l
				});
				else {
					let t = -1;
					for (; -1 !== (t = r.data.indexOf(o$6, t + 1));) d.push({
						type: 7,
						index: l
					}), t += o$6.length - 1;
				}
				l++;
			}
		}
		static createElement(t, i) {
			const s = l$1.createElement("template");
			return s.innerHTML = t, s;
		}
	};
	function M$1(t, i, s = t, e) {
		if (i === E) return i;
		let h = void 0 !== e ? s._$Co?.[e] : s._$Cl;
		const o = a(i) ? void 0 : i._$litDirective$;
		return h?.constructor !== o && (h?._$AO?.(!1), void 0 === o ? h = void 0 : (h = new o(t), h._$AT(t, s, e)), void 0 !== e ? (s._$Co ??= [])[e] = h : s._$Cl = h), void 0 !== h && (i = M$1(t, h._$AS(t, i.values), h, e)), i;
	}
	var R = class {
		constructor(t, i) {
			this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = i;
		}
		get parentNode() {
			return this._$AM.parentNode;
		}
		get _$AU() {
			return this._$AM._$AU;
		}
		u(t) {
			const { el: { content: i }, parts: s } = this._$AD, e = (t?.creationScope ?? l$1).importNode(i, !0);
			P.currentNode = e;
			let h = P.nextNode(), o = 0, n = 0, r = s[0];
			for (; void 0 !== r;) {
				if (o === r.index) {
					let i;
					2 === r.type ? i = new k(h, h.nextSibling, this, t) : 1 === r.type ? i = new r.ctor(h, r.name, r.strings, this, t) : 6 === r.type && (i = new Z(h, this, t)), this._$AV.push(i), r = s[++n];
				}
				o !== r?.index && (h = P.nextNode(), o++);
			}
			return P.currentNode = l$1, e;
		}
		p(t) {
			let i = 0;
			for (const s of this._$AV) void 0 !== s && (void 0 !== s.strings ? (s._$AI(t, s, i), i += s.strings.length - 2) : s._$AI(t[i])), i++;
		}
	};
	var k = class k {
		get _$AU() {
			return this._$AM?._$AU ?? this._$Cv;
		}
		constructor(t, i, s, e) {
			this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t, this._$AB = i, this._$AM = s, this.options = e, this._$Cv = e?.isConnected ?? !0;
		}
		get parentNode() {
			let t = this._$AA.parentNode;
			const i = this._$AM;
			return void 0 !== i && 11 === t?.nodeType && (t = i.parentNode), t;
		}
		get startNode() {
			return this._$AA;
		}
		get endNode() {
			return this._$AB;
		}
		_$AI(t, i = this) {
			t = M$1(this, t, i), a(t) ? t === A || null == t || "" === t ? (this._$AH !== A && this._$AR(), this._$AH = A) : t !== this._$AH && t !== E && this._(t) : void 0 !== t._$litType$ ? this.$(t) : void 0 !== t.nodeType ? this.T(t) : d$1(t) ? this.k(t) : this._(t);
		}
		O(t) {
			return this._$AA.parentNode.insertBefore(t, this._$AB);
		}
		T(t) {
			this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
		}
		_(t) {
			this._$AH !== A && a(this._$AH) ? this._$AA.nextSibling.data = t : this.T(l$1.createTextNode(t)), this._$AH = t;
		}
		$(t) {
			const { values: i, _$litType$: s } = t, e = "number" == typeof s ? this._$AC(t) : (void 0 === s.el && (s.el = S.createElement(V(s.h, s.h[0]), this.options)), s);
			if (this._$AH?._$AD === e) this._$AH.p(i);
			else {
				const t = new R(e, this), s = t.u(this.options);
				t.p(i), this.T(s), this._$AH = t;
			}
		}
		_$AC(t) {
			let i = C.get(t.strings);
			return void 0 === i && C.set(t.strings, i = new S(t)), i;
		}
		k(t) {
			u$2(this._$AH) || (this._$AH = [], this._$AR());
			const i = this._$AH;
			let s, e = 0;
			for (const h of t) e === i.length ? i.push(s = new k(this.O(c$3()), this.O(c$3()), this, this.options)) : s = i[e], s._$AI(h), e++;
			e < i.length && (this._$AR(s && s._$AB.nextSibling, e), i.length = e);
		}
		_$AR(t = this._$AA.nextSibling, s) {
			for (this._$AP?.(!1, !0, s); t !== this._$AB;) {
				const s = i$4(t).nextSibling;
				i$4(t).remove(), t = s;
			}
		}
		setConnected(t) {
			void 0 === this._$AM && (this._$Cv = t, this._$AP?.(t));
		}
	};
	var H = class {
		get tagName() {
			return this.element.tagName;
		}
		get _$AU() {
			return this._$AM._$AU;
		}
		constructor(t, i, s, e, h) {
			this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t, this.name = i, this._$AM = e, this.options = h, s.length > 2 || "" !== s[0] || "" !== s[1] ? (this._$AH = Array(s.length - 1).fill(/* @__PURE__ */ new String()), this.strings = s) : this._$AH = A;
		}
		_$AI(t, i = this, s, e) {
			const h = this.strings;
			let o = !1;
			if (void 0 === h) t = M$1(this, t, i, 0), o = !a(t) || t !== this._$AH && t !== E, o && (this._$AH = t);
			else {
				const e = t;
				let n, r;
				for (t = h[0], n = 0; n < h.length - 1; n++) r = M$1(this, e[s + n], i, n), r === E && (r = this._$AH[n]), o ||= !a(r) || r !== this._$AH[n], r === A ? t = A : t !== A && (t += (r ?? "") + h[n + 1]), this._$AH[n] = r;
			}
			o && !e && this.j(t);
		}
		j(t) {
			t === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
		}
	};
	var I = class extends H {
		constructor() {
			super(...arguments), this.type = 3;
		}
		j(t) {
			this.element[this.name] = t === A ? void 0 : t;
		}
	};
	var L = class extends H {
		constructor() {
			super(...arguments), this.type = 4;
		}
		j(t) {
			this.element.toggleAttribute(this.name, !!t && t !== A);
		}
	};
	var z = class extends H {
		constructor(t, i, s, e, h) {
			super(t, i, s, e, h), this.type = 5;
		}
		_$AI(t, i = this) {
			if ((t = M$1(this, t, i, 0) ?? A) === E) return;
			const s = this._$AH, e = t === A && s !== A || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, h = t !== A && (s === A || e);
			e && this.element.removeEventListener(this.name, this, s), h && this.element.addEventListener(this.name, this, t), this._$AH = t;
		}
		handleEvent(t) {
			"function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
		}
	};
	var Z = class {
		constructor(t, i, s) {
			this.element = t, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
		}
		get _$AU() {
			return this._$AM._$AU;
		}
		_$AI(t) {
			M$1(this, t);
		}
	};
	var j$1 = {
		M: h$3,
		P: o$6,
		A: n$5,
		C: 1,
		L: N,
		R,
		D: d$1,
		V: M$1,
		I: k,
		H,
		N: L,
		U: z,
		B: I,
		F: Z
	};
	var B = t$3.litHtmlPolyfillSupport;
	B?.(S, k), (t$3.litHtmlVersions ??= []).push("3.3.3");
	var D = (t, i, s) => {
		const e = s?.renderBefore ?? i;
		let h = e._$litPart$;
		if (void 0 === h) {
			const t = s?.renderBefore ?? null;
			e._$litPart$ = h = new k(i.insertBefore(c$3(), t), t, void 0, s ?? {});
		}
		return h._$AI(t), h;
	};
	//#endregion
	//#region node_modules/lit-element/lit-element.js
	/**
	* @license
	* Copyright 2017 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/ var s$2 = globalThis;
	var i$3 = class extends y$1 {
		constructor() {
			super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
		}
		createRenderRoot() {
			const t = super.createRenderRoot();
			return this.renderOptions.renderBefore ??= t.firstChild, t;
		}
		update(t) {
			const r = this.render();
			this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = D(r, this.renderRoot, this.renderOptions);
		}
		connectedCallback() {
			super.connectedCallback(), this._$Do?.setConnected(!0);
		}
		disconnectedCallback() {
			super.disconnectedCallback(), this._$Do?.setConnected(!1);
		}
		render() {
			return E;
		}
	};
	i$3._$litElement$ = !0, i$3["finalized"] = !0, s$2.litElementHydrateSupport?.({ LitElement: i$3 });
	var o$5 = s$2.litElementPolyfillSupport;
	o$5?.({ LitElement: i$3 });
	(s$2.litElementVersions ??= []).push("4.2.2");
	//#endregion
	//#region node_modules/@lit/reactive-element/decorators/custom-element.js
	/**
	* @license
	* Copyright 2017 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/
	var t$2 = (t) => (e, o) => {
		void 0 !== o ? o.addInitializer(() => {
			customElements.define(t, e);
		}) : customElements.define(t, e);
	};
	//#endregion
	//#region node_modules/@lit/reactive-element/decorators/property.js
	/**
	* @license
	* Copyright 2017 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/ var o$4 = {
		attribute: !0,
		type: String,
		converter: u$3,
		reflect: !1,
		hasChanged: f$3
	};
	var r$3 = (t = o$4, e, r) => {
		const { kind: n, metadata: i } = r;
		let s = globalThis.litPropertyMetadata.get(i);
		if (void 0 === s && globalThis.litPropertyMetadata.set(i, s = /* @__PURE__ */ new Map()), "setter" === n && ((t = Object.create(t)).wrapped = !0), s.set(r.name, t), "accessor" === n) {
			const { name: o } = r;
			return {
				set(r) {
					const n = e.get.call(this);
					e.set.call(this, r), this.requestUpdate(o, n, t, !0, r);
				},
				init(e) {
					return void 0 !== e && this.C(o, void 0, t, e), e;
				}
			};
		}
		if ("setter" === n) {
			const { name: o } = r;
			return function(r) {
				const n = this[o];
				e.call(this, r), this.requestUpdate(o, n, t, !0, r);
			};
		}
		throw Error("Unsupported decorator location: " + n);
	};
	function n$4(t) {
		return (e, o) => "object" == typeof o ? r$3(t, e, o) : ((t, e, o) => {
			const r = e.hasOwnProperty(o);
			return e.constructor.createProperty(o, t), r ? Object.getOwnPropertyDescriptor(e, o) : void 0;
		})(t, e, o);
	}
	//#endregion
	//#region node_modules/@lit/reactive-element/decorators/state.js
	/**
	* @license
	* Copyright 2017 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/ function r$2(r) {
		return n$4({
			...r,
			state: !0,
			attribute: !1
		});
	}
	//#endregion
	//#region node_modules/lit-html/directive.js
	/**
	* @license
	* Copyright 2017 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/
	var t$1 = {
		ATTRIBUTE: 1,
		CHILD: 2,
		PROPERTY: 3,
		BOOLEAN_ATTRIBUTE: 4,
		EVENT: 5,
		ELEMENT: 6
	};
	var e$4 = (t) => (...e) => ({
		_$litDirective$: t,
		values: e
	});
	var i$2 = class {
		constructor(t) {}
		get _$AU() {
			return this._$AM._$AU;
		}
		_$AT(t, e, i) {
			this._$Ct = t, this._$AM = e, this._$Ci = i;
		}
		_$AS(t, e) {
			return this.update(t, e);
		}
		update(t, e) {
			return this.render(...e);
		}
	};
	//#endregion
	//#region node_modules/lit-html/directives/unsafe-html.js
	/**
	* @license
	* Copyright 2017 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/ var e$3 = class extends i$2 {
		constructor(i) {
			if (super(i), this.it = A, i.type !== t$1.CHILD) throw Error(this.constructor.directiveName + "() can only be used in child bindings");
		}
		render(r) {
			if (r === A || null == r) return this._t = void 0, this.it = r;
			if (r === E) return r;
			if ("string" != typeof r) throw Error(this.constructor.directiveName + "() called with a non-string value");
			if (r === this.it) return this._t;
			this.it = r;
			const s = [r];
			return s.raw = s, this._t = {
				_$litType$: this.constructor.resultType,
				strings: s,
				values: []
			};
		}
	};
	e$3.directiveName = "unsafeHTML", e$3.resultType = 1;
	var o$3 = e$4(e$3);
	//#endregion
	//#region node_modules/lit-html/directives/class-map.js
	/**
	* @license
	* Copyright 2018 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/ var e$2 = e$4(class extends i$2 {
		constructor(t) {
			if (super(t), t.type !== t$1.ATTRIBUTE || "class" !== t.name || t.strings?.length > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
		}
		render(t) {
			return " " + Object.keys(t).filter((s) => t[s]).join(" ") + " ";
		}
		update(s, [i]) {
			if (void 0 === this.st) {
				this.st = /* @__PURE__ */ new Set(), void 0 !== s.strings && (this.nt = new Set(s.strings.join(" ").split(/\s/).filter((t) => "" !== t)));
				for (const t in i) i[t] && !this.nt?.has(t) && this.st.add(t);
				return this.render(i);
			}
			const r = s.element.classList;
			for (const t of this.st) t in i || (r.remove(t), this.st.delete(t));
			for (const t in i) {
				const s = !!i[t];
				s === this.st.has(t) || this.nt?.has(t) || (s ? (r.add(t), this.st.add(t)) : (r.remove(t), this.st.delete(t)));
			}
			return E;
		}
	});
	//#endregion
	//#region src/components/cursor-hint/cursor-hint.css?inline
	var cursor_hint_default = ":host {\n  display: contents;\n}\n.cursor-hint {\n  position: fixed;\n  z-index: 200;\n  width: max-content;\n  max-width: 16rem;\n  padding: 0.3rem 0.5rem;\n  border-radius: 0.25rem;\n  background: var(--panel);\n  border: 1px solid var(--border);\n  color: var(--text);\n  font-family: var(--font-ui);\n  font-size: 0.75rem;\n  line-height: 1.35;\n  text-align: center;\n  white-space: normal;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);\n  pointer-events: none;\n}\n.cursor-hint.cursor-hint-detail {\n  max-width: 24rem;\n  padding: 0.45rem 0.55rem;\n  text-align: left;\n}\n.head-tooltip {\n  border-collapse: collapse;\n  width: 100%;\n  font-size: 0.6875rem;\n  line-height: 1.4;\n}\n.head-tooltip th {\n  padding: 0.1rem 0.55rem 0.1rem 0;\n  color: var(--muted);\n  font-weight: 600;\n  text-align: left;\n  vertical-align: top;\n  white-space: nowrap;\n}\n.head-tooltip td {\n  padding: 0.1rem 0;\n  vertical-align: top;\n  word-break: break-word;\n}\n.head-tooltip .head-default {\n  color: var(--muted);\n  font-style: italic;\n  white-space: nowrap;\n}\n";
	//#endregion
	//#region \0@oxc-project+runtime@0.144.0/helpers/esm/decorate.js
	function __decorate(decorators, target, key, desc) {
		var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
		else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
		return c > 3 && r && Object.defineProperty(target, key, r), r;
	}
	//#endregion
	//#region src/components/cursor-hint/cursor-hint.ts
	/** <doclang-cursor-hint> — floating tooltip that follows the pointer */
	var OFFSET = 10;
	var MARGIN = 8;
	var DoclangCursorHint = class DoclangCursorHint extends i$3 {
		static styles = r$6(cursor_hint_default);
		_content = null;
		_isHtml = false;
		_detail = false;
		_hidden = true;
		_left = 0;
		_top = 0;
		hide() {
			this._content = null;
			this._isHtml = false;
			this._detail = false;
			this._hidden = true;
			this.requestUpdate();
		}
		show(content, clientX, clientY, detail = false) {
			this._content = content;
			this._isHtml = false;
			this._detail = detail;
			this._hidden = false;
			this._position(clientX, clientY);
			this.requestUpdate();
		}
		showHtml(html, clientX, clientY) {
			this._content = html;
			this._isHtml = true;
			this._detail = true;
			this._hidden = false;
			this._position(clientX, clientY);
			this.requestUpdate();
		}
		render() {
			if (this._hidden || this._content === null) return A;
			const classes = {
				"cursor-hint": true,
				"cursor-hint-detail": this._detail
			};
			const style = `left:${this._left}px;top:${this._top}px`;
			if (this._isHtml && typeof this._content === "string") return b`<div class=${e$2(classes)} role="tooltip" style=${style}>
        ${o$3(this._content)}
      </div>`;
			if (typeof this._content === "string") return b`<div class=${e$2(classes)} role="tooltip" style=${style}>
        ${this._content}
      </div>`;
			return b`<div class=${e$2(classes)} role="tooltip" style=${style}></div>`;
		}
		updated() {
			if (!this._hidden && this._content instanceof Node) {
				const hint = this.shadowRoot?.querySelector(".cursor-hint");
				if (hint) {
					hint.replaceChildren(this._content.cloneNode(true));
					const rect = hint.getBoundingClientRect();
					this._repositionFromRect(rect);
				}
			}
		}
		_position(clientX, clientY) {
			this._left = Math.max(MARGIN, clientX + OFFSET);
			this._top = Math.max(MARGIN, clientY + OFFSET);
		}
		_repositionFromRect(rect) {
			const hint = this.shadowRoot?.querySelector(".cursor-hint");
			if (!hint) return;
			if (this._left + rect.width > window.innerWidth - MARGIN) this._left = Math.max(MARGIN, this._left - rect.width - 20);
			if (this._top + rect.height > window.innerHeight - MARGIN) this._top = Math.max(MARGIN, this._top - rect.height - 20);
			hint.style.left = `${this._left}px`;
			hint.style.top = `${this._top}px`;
		}
	};
	DoclangCursorHint = __decorate([t$2("doclang-cursor-hint")], DoclangCursorHint);
	//#endregion
	//#region node_modules/lit-html/directive-helpers.js
	/**
	* @license
	* Copyright 2020 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/ var { I: t } = j$1, i$1 = (o) => o, r$1 = (o) => void 0 === o.strings, s$1 = () => document.createComment(""), v = (o, n, e) => {
		const l = o._$AA.parentNode, d = void 0 === n ? o._$AB : n._$AA;
		if (void 0 === e) e = new t(l.insertBefore(s$1(), d), l.insertBefore(s$1(), d), o, o.options);
		else {
			const t = e._$AB.nextSibling, n = e._$AM, c = n !== o;
			if (c) {
				let t;
				e._$AQ?.(o), e._$AM = o, void 0 !== e._$AP && (t = o._$AU) !== n._$AU && e._$AP(t);
			}
			if (t !== d || c) {
				let o = e._$AA;
				for (; o !== t;) {
					const t = i$1(o).nextSibling;
					i$1(l).insertBefore(o, d), o = t;
				}
			}
		}
		return e;
	}, u$1 = (o, t, i = o) => (o._$AI(t, i), o), m = {}, p = (o, t = m) => o._$AH = t, M = (o) => o._$AH, h$2 = (o) => {
		o._$AR(), o._$AA.remove();
	};
	//#endregion
	//#region node_modules/lit-html/async-directive.js
	/**
	* @license
	* Copyright 2017 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/ var s = (i, t) => {
		const e = i._$AN;
		if (void 0 === e) return !1;
		for (const i of e) i._$AO?.(t, !1), s(i, t);
		return !0;
	};
	var o$2 = (i) => {
		let t, e;
		do {
			if (void 0 === (t = i._$AM)) break;
			e = t._$AN, e.delete(i), i = t;
		} while (0 === e?.size);
	};
	var r = (i) => {
		for (let t; t = i._$AM; i = t) {
			let e = t._$AN;
			if (void 0 === e) t._$AN = e = /* @__PURE__ */ new Set();
			else if (e.has(i)) break;
			e.add(i), c$1(t);
		}
	};
	function h$1(i) {
		void 0 !== this._$AN ? (o$2(this), this._$AM = i, r(this)) : this._$AM = i;
	}
	function n$2(i, t = !1, e = 0) {
		const r = this._$AH, h = this._$AN;
		if (void 0 !== h && 0 !== h.size) if (t) if (Array.isArray(r)) for (let i = e; i < r.length; i++) s(r[i], !1), o$2(r[i]);
		else null != r && (s(r, !1), o$2(r));
		else s(this, i);
	}
	var c$1 = (i) => {
		i.type == t$1.CHILD && (i._$AP ??= n$2, i._$AQ ??= h$1);
	};
	var f = class extends i$2 {
		constructor() {
			super(...arguments), this._$AN = void 0;
		}
		_$AT(i, t, e) {
			super._$AT(i, t, e), r(this), this.isConnected = i._$AU;
		}
		_$AO(i, t = !0) {
			i !== this.isConnected && (this.isConnected = i, i ? this.reconnected?.() : this.disconnected?.()), t && (s(this, i), o$2(this));
		}
		setValue(t) {
			if (r$1(this._$Ct)) this._$Ct._$AI(t, this);
			else {
				const i = [...this._$Ct._$AH];
				i[this._$Ci] = t, this._$Ct._$AI(i, this, 0);
			}
		}
		disconnected() {}
		reconnected() {}
	};
	//#endregion
	//#region node_modules/lit-html/directives/ref.js
	/**
	* @license
	* Copyright 2020 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/ var e = () => new h();
	var h = class {};
	var o$1 = /* @__PURE__ */ new WeakMap();
	var n$1 = e$4(class extends f {
		render(i) {
			return A;
		}
		update(i, [s]) {
			const e = s !== this.G;
			return e && this.rt(void 0), (e || this.lt !== this.ct) && (this.G = s, this.ht = i.options?.host, this.rt(this.ct = i.element)), A;
		}
		rt(t) {
			if (void 0 !== this.G) if (this.isConnected || (t = void 0), "function" == typeof this.G) {
				const i = this.ht ?? globalThis;
				let s = o$1.get(i);
				void 0 === s && (s = /* @__PURE__ */ new WeakMap(), o$1.set(i, s)), void 0 !== s.get(this.G) && this.G.call(this.ht, void 0), s.set(this.G, t), void 0 !== t && this.G.call(this.ht, t);
			} else this.G.value = t;
		}
		get lt() {
			return "function" == typeof this.G ? o$1.get(this.ht ?? globalThis)?.get(this.G) : this.G?.value;
		}
		disconnected() {
			this.lt === this.ct && this.rt(void 0);
		}
		reconnected() {
			this.rt(this.ct);
		}
	});
	//#endregion
	//#region src/components/page-nav/page-nav.css?inline
	var page_nav_default = ":host {\n  display: contents;\n}\nnav {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  margin-left: 0.25rem;\n}\nnav::before {\n  content: '';\n  flex-shrink: 0;\n  align-self: center;\n  width: 1px;\n  height: 1.125rem;\n  margin-right: 0.75rem;\n  background: var(--border);\n}\nnav[hidden] {\n  display: none;\n}\n.page-nav-btns {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.25rem;\n}\n.page-nav-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 1.875rem;\n  height: 1.875rem;\n  padding: 0;\n  flex-shrink: 0;\n  appearance: none;\n  border: 1px solid var(--border);\n  background: var(--panel);\n  color: var(--text);\n  border-radius: 0.375rem;\n  font: inherit;\n  font-size: 0.875rem;\n  cursor: pointer;\n}\n.page-nav-btn:hover {\n  border-color: var(--accent);\n}\n.page-nav-btn:disabled {\n  opacity: 0.45;\n  cursor: not-allowed;\n}\n.page-nav-chevron {\n  display: block;\n  width: 0.875rem;\n  height: 0.875rem;\n}\n.page-indicator {\n  display: inline-flex;\n  align-items: center;\n  font-size: 0.875rem;\n  color: var(--muted);\n  font-variant-numeric: tabular-nums;\n}\n.page-number-input {\n  appearance: none;\n  border: 1px solid var(--border);\n  border-radius: 0.375rem;\n  background: var(--panel);\n  color: var(--text);\n  font: inherit;\n  font-size: 0.875rem;\n  font-variant-numeric: tabular-nums;\n  text-align: center;\n  padding: 0 0.35rem;\n  margin: 0;\n  height: 1.875rem;\n  box-sizing: border-box;\n  width: calc(var(--page-num-digits, 1) * 1ch + 0.75rem);\n  line-height: 1;\n  cursor: text;\n}\n.page-number-input:hover:not(:disabled) {\n  border-color: var(--accent);\n}\n.page-number-input:focus {\n  outline: none;\n  border-color: var(--accent);\n  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 22%, transparent);\n}\n.page-number-input:disabled {\n  opacity: 0.55;\n  cursor: not-allowed;\n}\n";
	//#endregion
	//#region src/components/page-nav/page-nav.ts
	/** <doclang-page-nav> — page navigation (prev/next buttons + page indicator) */
	var DoclangPageNav = class DoclangPageNav extends i$3 {
		static styles = r$6(page_nav_default);
		_currentPage = 1;
		_pageCount = 1;
		_visible = false;
		_inputRef = e();
		render() {
			if (!this._visible) return A;
			const digits = Math.max(1, String(this._pageCount).length);
			return b`
      <nav id="page-nav" aria-label="Page navigation">
        <div class="page-nav-btns">
          <button
            type="button"
            class="page-nav-btn btn-prev"
            aria-label="Previous page"
            title="Previous page"
            ?disabled=${this._currentPage <= 1}
            @click=${() => this.dispatchEvent(new CustomEvent("doclang-prev-page", {
				bubbles: true,
				composed: true
			}))}
          >
            <svg
              class="page-nav-chevron"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <path
                d="M10.5 3.5 5.5 8l5 4.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
          </button>
          <button
            type="button"
            class="page-nav-btn btn-next"
            aria-label="Next page"
            title="Next page"
            ?disabled=${this._currentPage >= this._pageCount}
            @click=${() => this.dispatchEvent(new CustomEvent("doclang-next-page", {
				bubbles: true,
				composed: true
			}))}
          >
            <svg
              class="page-nav-chevron"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <path
                d="M5.5 3.5 10.5 8l-5 4.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
          </button>
        </div>
        <div class="page-indicator">
          <span>Page&#xA0;</span>
          <input
            ${n$1(this._inputRef)}
            type="text"
            inputmode="numeric"
            class="page-number-input"
            .value=${String(this._currentPage)}
            style="--page-num-digits:${digits}"
            aria-label="Page number"
            @keydown=${this._onInputKeydown}
            @blur=${this._onInputBlur}
            @focus=${(e) => e.target.select()}
          />
          <span class="page-count">&#xA0;of ${this._pageCount}</span>
        </div>
      </nav>
    `;
		}
		setVisible(visible) {
			this._visible = visible;
			this.requestUpdate();
		}
		setIndicator(pageNum, pageCount) {
			this._currentPage = pageNum;
			this._pageCount = pageCount;
			this.requestUpdate();
		}
		reset() {
			this._currentPage = 1;
			this._pageCount = 1;
			this._visible = false;
			this.requestUpdate();
		}
		_onInputKeydown = (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				this._commitInput();
				e.target.blur();
			} else if (e.key === "Escape") {
				e.preventDefault();
				this._resetInput();
				e.target.blur();
			}
		};
		_onInputBlur = () => this._resetInput();
		_resetInput() {
			const input = this._inputRef.value;
			if (input) input.value = String(this._currentPage);
		}
		_commitInput() {
			const input = this._inputRef.value;
			if (!input) return;
			const n = Number.parseInt(input.value.trim(), 10);
			if (!Number.isFinite(n)) {
				this._resetInput();
				return;
			}
			const page = Math.min(Math.max(1, n), this._pageCount);
			this.dispatchEvent(new CustomEvent("doclang-go-to-page", {
				bubbles: true,
				composed: true,
				detail: { page }
			}));
		}
	};
	DoclangPageNav = __decorate([t$2("doclang-page-nav")], DoclangPageNav);
	//#endregion
	//#region src/components/toolbar/toolbar.css?inline
	var toolbar_default = ":host {\n  display: contents;\n}\n.toolbar {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  flex-wrap: wrap;\n  grid-column: 3;\n  justify-self: end;\n}\n.header-divider {\n  flex-shrink: 0;\n  align-self: center;\n  width: 1px;\n  height: 1.125rem;\n  background: var(--border);\n}\n.toolbar-options-wrap {\n  position: relative;\n}\n/* Menu/control triggers */\n.toolbar-options-btn {\n  appearance: none;\n  border: 1px solid transparent;\n  background: transparent;\n  color: var(--muted);\n  font-weight: 500;\n  cursor: pointer;\n  white-space: nowrap;\n  flex-shrink: 0;\n  display: inline-flex;\n  align-items: center;\n  transition:\n    color 0.12s ease,\n    background 0.12s ease,\n    border-color 0.12s ease;\n  border-radius: 0.375rem;\n  padding: 0.35rem 0.45rem 0.35rem 0.55rem;\n  font-size: 0.8125rem;\n  line-height: 1.2;\n  font: inherit;\n}\n.toolbar-options-btn::after {\n  content: '';\n  flex-shrink: 0;\n  width: 0.32rem;\n  height: 0.32rem;\n  margin-left: 0.3rem;\n  margin-top: -0.14em;\n  border-right: 1.5px solid currentColor;\n  border-bottom: 1.5px solid currentColor;\n  transform: rotate(45deg);\n  opacity: 0.65;\n}\n.toolbar-options-btn:hover {\n  color: var(--text);\n  background: color-mix(in srgb, var(--text) 5%, transparent);\n}\n.toolbar-options-btn[aria-expanded='true'] {\n  color: var(--accent);\n  background: color-mix(in srgb, var(--accent) 10%, var(--panel));\n  border-color: color-mix(in srgb, var(--accent) 22%, transparent);\n}\n.toolbar-options-btn:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: 2px;\n}\n.toolbar-options-panel {\n  position: absolute;\n  top: calc(100% + 0.35rem);\n  right: 0;\n  z-index: 30;\n  min-width: 11rem;\n  padding: 0.5rem 0;\n  border: 1px solid var(--border);\n  border-radius: 0.375rem;\n  background: var(--panel);\n  box-shadow: 0 0.5rem 1.25rem color-mix(in srgb, var(--text) 12%, transparent);\n}\n.toolbar-options-panel[hidden] {\n  display: none;\n}\n.toolbar-options-item {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.35rem 0.75rem;\n  font-size: 0.875rem;\n  cursor: pointer;\n  font-family: var(--font-ui);\n}\n.toolbar-options-item:hover {\n  background: color-mix(in srgb, var(--accent) 6%, var(--panel));\n}\n.toolbar-options-item input {\n  margin: 0;\n  flex-shrink: 0;\n  cursor: pointer;\n}\n.toolbar-options-item-disabled {\n  opacity: 0.45;\n  cursor: not-allowed;\n}\n.toolbar-options-item-disabled input {\n  cursor: not-allowed;\n}\n.toolbar-options-divider {\n  margin: 0.35rem 0;\n  border-top: 1px solid var(--border);\n}\n.toolbar-options-reset {\n  display: block;\n  width: 100%;\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0.35rem 0.75rem;\n  border: 0;\n  border-radius: 0;\n  background: transparent;\n  color: var(--text);\n  font: inherit;\n  font-size: 0.875rem;\n  text-align: left;\n  cursor: pointer;\n}\n.toolbar-options-reset:hover:not(:disabled) {\n  background: color-mix(in srgb, var(--accent) 6%, var(--panel));\n  color: var(--accent);\n}\n.toolbar-options-reset:disabled {\n  opacity: 0.45;\n  cursor: not-allowed;\n}\n.toolbar-file-group {\n  display: inline-flex;\n  align-items: center;\n}\nbutton,\nlabel.file-btn {\n  appearance: none;\n  border: 1px solid var(--border);\n  background: var(--panel);\n  color: var(--text);\n  border-radius: 0.375rem;\n  padding: 0.4rem 0.75rem;\n  font: inherit;\n  font-size: 0.875rem;\n  cursor: pointer;\n}\nbutton:hover,\nlabel.file-btn:hover {\n  border-color: var(--accent);\n}\nbutton:disabled {\n  opacity: 0.45;\n  cursor: not-allowed;\n}\nlabel.file-btn input {\n  display: none;\n}\n.header-site-link {\n  color: var(--muted);\n  font-size: 0.875rem;\n  text-decoration: none;\n  white-space: nowrap;\n}\n.header-site-link:hover {\n  color: var(--accent);\n  text-decoration: underline;\n}\n.header-site-link:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: 2px;\n  border-radius: 0.125rem;\n}\n";
	//#endregion
	//#region src/components/toolbar/toolbar.ts
	/** <doclang-toolbar> — header toolbar (Views menu, file open, demo, site link) */
	var OPEN_FILE_HINT = `Open a DocLang file (.dclx, .dclg)`;
	var DoclangToolbar = class DoclangToolbar extends i$3 {
		static styles = r$6(toolbar_default);
		_panelOpen = false;
		_demoLoading = false;
		_panes = {
			file: true,
			page: true,
			markup: true,
			reading: true,
			fileAvailable: false,
			pageAvailable: false,
			hasState: false
		};
		_inputArchiveRef = e();
		render() {
			const { file, page, markup, reading, fileAvailable, pageAvailable, hasState } = this._panes;
			return b`
      <div class="toolbar">
        <div class="toolbar-options-wrap">
          <button
            type="button"
            class="toolbar-options-btn"
            aria-expanded=${this._panelOpen ? "true" : "false"}
            aria-haspopup="true"
            @click=${this._onOptionsClick}
          >
            Views
          </button>
          ${this._panelOpen ? b`
                  <div class="toolbar-options-panel" role="menu">
                    <label
                      class=${e$2({
				"toolbar-options-item": true,
				"toolbar-options-item-disabled": !fileAvailable
			})}
                    >
                      <input
                        type="checkbox"
                        class="cb-file-pane"
                        role="menuitemcheckbox"
                        .checked=${fileAvailable && file}
                        ?disabled=${!fileAvailable}
                        @change=${(e) => this._emitTogglePane("file", e.target.checked)}
                      />
                      <span>Files</span>
                    </label>
                    <label
                      class=${e$2({
				"toolbar-options-item": true,
				"toolbar-options-item-disabled": !pageAvailable
			})}
                    >
                      <input
                        type="checkbox"
                        class="cb-page-pane"
                        role="menuitemcheckbox"
                        .checked=${pageAvailable && page}
                        ?disabled=${!pageAvailable}
                        @change=${(e) => this._emitTogglePane("page", e.target.checked)}
                      />
                      <span>Original page</span>
                    </label>
                    <label
                      class=${e$2({
				"toolbar-options-item": true,
				"toolbar-options-item-disabled": !hasState
			})}
                    >
                      <input
                        type="checkbox"
                        class="cb-markup-pane"
                        role="menuitemcheckbox"
                        .checked=${markup}
                        ?disabled=${!hasState}
                        @change=${(e) => this._emitTogglePane("markup", e.target.checked)}
                      />
                      <span>DocLang</span>
                    </label>
                    <label
                      class=${e$2({
				"toolbar-options-item": true,
				"toolbar-options-item-disabled": !hasState
			})}
                    >
                      <input
                        type="checkbox"
                        class="cb-reading-pane"
                        role="menuitemcheckbox"
                        .checked=${reading}
                        ?disabled=${!hasState}
                        @change=${(e) => this._emitTogglePane("reading", e.target.checked)}
                      />
                      <span>Reading view</span>
                    </label>
                    <div class="toolbar-options-divider" role="separator"></div>
                    <button
                      type="button"
                      class="toolbar-options-reset"
                      role="menuitem"
                      ?disabled=${!hasState}
                      @click=${() => this.dispatchEvent(new CustomEvent("doclang-reset-pane-layout", {
				bubbles: true,
				composed: true
			}))}
                    >
                      Reset views
                    </button>
                  </div>
                ` : A}
        </div>
        <span class="header-divider" aria-hidden="true"></span>
        <span class="toolbar-file-group">
          <label
            class="file-btn"
            @mousemove=${this._onFileBtnMousemove}
            @mouseleave=${this._onFileBtnMouseleave}
          >
            Open file
            <input
              ${n$1(this._inputArchiveRef)}
              type="file"
              class="input-archive"
              multiple
              accept=".dclx,.zip,.dclg,.xml,application/zip,application/xml,text/xml"
              @change=${this._onArchiveChange}
            />
          </label>
        </span>
        <button
          type="button"
          class="btn-demo"
          ?disabled=${this._demoLoading}
          @click=${() => this.dispatchEvent(new CustomEvent("doclang-load-demo", {
				bubbles: true,
				composed: true
			}))}
        >
          Load demo
        </button>
        <span class="header-divider" aria-hidden="true"></span>
        <a href="https://doclang.ai/" class="header-site-link">doclang.ai</a>
      </div>
    `;
		}
		/** Sync the Views-menu checkboxes and disabled/greyed state from app state. */
		syncPaneToggles(opts) {
			this._panes = opts;
			this.requestUpdate();
		}
		setDemoLoading(loading) {
			this._demoLoading = loading;
			this.requestUpdate();
		}
		setOptionsOpen(open) {
			this._panelOpen = open;
			this.requestUpdate();
		}
		closeOptionsIfOpen() {
			if (this._panelOpen) this.setOptionsOpen(false);
		}
		connectedCallback() {
			super.connectedCallback();
			document.addEventListener("click", this._onDocClick);
		}
		disconnectedCallback() {
			super.disconnectedCallback();
			document.removeEventListener("click", this._onDocClick);
		}
		_onDocClick = (e) => {
			if (!this._panelOpen) return;
			if (e.composedPath().includes(this)) return;
			this.setOptionsOpen(false);
		};
		_onOptionsClick = (e) => {
			e.stopPropagation();
			this.setOptionsOpen(!this._panelOpen);
		};
		_emitTogglePane(pane, checked) {
			this.dispatchEvent(new CustomEvent("doclang-toggle-pane", {
				bubbles: true,
				composed: true,
				detail: {
					pane,
					checked
				}
			}));
		}
		_onArchiveChange = (e) => {
			const input = e.target;
			this.dispatchEvent(new CustomEvent("doclang-open-files", {
				bubbles: true,
				composed: true,
				detail: { files: [...input.files ?? []] }
			}));
			input.value = "";
		};
		_onFileBtnMousemove = (e) => {
			this.dispatchEvent(new CustomEvent("doclang-hint", {
				bubbles: true,
				composed: true,
				detail: {
					text: OPEN_FILE_HINT,
					clientX: e.clientX,
					clientY: e.clientY
				}
			}));
		};
		_onFileBtnMouseleave = () => {
			this.dispatchEvent(new CustomEvent("doclang-hint-hide", {
				bubbles: true,
				composed: true
			}));
		};
	};
	DoclangToolbar = __decorate([t$2("doclang-toolbar")], DoclangToolbar);
	//#endregion
	//#region node_modules/lit-html/directives/repeat.js
	/**
	* @license
	* Copyright 2017 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/
	var u = (e, s, t) => {
		const r = /* @__PURE__ */ new Map();
		for (let l = s; l <= t; l++) r.set(e[l], l);
		return r;
	};
	var c = e$4(class extends i$2 {
		constructor(e) {
			if (super(e), e.type !== t$1.CHILD) throw Error("repeat() can only be used in text expressions");
		}
		dt(e, s, t) {
			let r;
			void 0 === t ? t = s : void 0 !== s && (r = s);
			const l = [], o = [];
			let i = 0;
			for (const s of e) l[i] = r ? r(s, i) : i, o[i] = t(s, i), i++;
			return {
				values: o,
				keys: l
			};
		}
		render(e, s, t) {
			return this.dt(e, s, t).values;
		}
		update(s, [t, r, c]) {
			const d = M(s), { values: p$3, keys: a } = this.dt(t, r, c);
			if (!Array.isArray(d)) return this.ut = a, p$3;
			const h = this.ut ??= [], v$2 = [];
			let m, y, x = 0, j = d.length - 1, k = 0, w = p$3.length - 1;
			for (; x <= j && k <= w;) if (null === d[x]) x++;
			else if (null === d[j]) j--;
			else if (h[x] === a[k]) v$2[k] = u$1(d[x], p$3[k]), x++, k++;
			else if (h[j] === a[w]) v$2[w] = u$1(d[j], p$3[w]), j--, w--;
			else if (h[x] === a[w]) v$2[w] = u$1(d[x], p$3[w]), v(s, v$2[w + 1], d[x]), x++, w--;
			else if (h[j] === a[k]) v$2[k] = u$1(d[j], p$3[k]), v(s, d[x], d[j]), j--, k++;
			else if (void 0 === m && (m = u(a, k, w), y = u(h, x, j)), m.has(h[x])) if (m.has(h[j])) {
				const e = y.get(a[k]), t = void 0 !== e ? d[e] : null;
				if (null === t) {
					const e = v(s, d[x]);
					u$1(e, p$3[k]), v$2[k] = e;
				} else v$2[k] = u$1(t, p$3[k]), v(s, d[x], t), d[e] = null;
				k++;
			} else h$2(d[j]), j--;
			else h$2(d[x]), x++;
			for (; k <= w;) {
				const e = v(s, v$2[w + 1]);
				u$1(e, p$3[k]), v$2[k++] = e;
			}
			for (; x <= j;) {
				const e = d[x++];
				null !== e && h$2(e);
			}
			return this.ut = a, p(s, v$2), E;
		}
	});
	//#endregion
	//#region src/components/file-pane/file-pane.css?inline
	var file_pane_default = ":host {\n  display: flex;\n  flex-direction: column;\n  border-right: 1px solid var(--border);\n  min-height: 0;\n  min-width: 0;\n  overflow: hidden;\n}\n:host([hidden]) {\n  display: none !important;\n}\n:host(.pane-layout-last) {\n  border-right: none;\n}\n.pane-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.35rem;\n  box-sizing: border-box;\n  height: 2.125rem;\n  padding: 0 0.35rem;\n  font-size: 0.75rem;\n  font-weight: 600;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  color: var(--muted);\n  border-bottom: 1px solid var(--border);\n  background: var(--panel);\n}\n.pane-header-title {\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  padding-inline: calc(0.75rem - 0.35rem);\n}\n.file-pane-close-all {\n  appearance: none;\n  border: 1px solid transparent;\n  border-radius: 0.25rem;\n  background: transparent;\n  color: var(--muted);\n  font: inherit;\n  font-size: 0.625rem;\n  font-weight: 600;\n  line-height: 1;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  padding: 0 0.15rem;\n  height: 1.25rem;\n  cursor: pointer;\n  white-space: nowrap;\n  flex-shrink: 0;\n  transition:\n    color 0.12s ease,\n    background 0.12s ease,\n    border-color 0.12s ease;\n}\n.file-pane-close-all:hover {\n  color: var(--text);\n  background: color-mix(in srgb, var(--text) 5%, transparent);\n}\n.file-pane-close-all:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: 2px;\n}\n.pane-body {\n  flex: 1;\n  min-height: 0;\n  overflow: auto;\n  padding: 0.375rem var(--file-pane-pad-x, 0.5rem);\n  min-width: 0;\n}\n.file-view-list {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  width: 100%;\n}\n.file-view-list > li {\n  width: 100%;\n  max-width: 100%;\n}\n.file-view-item {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 0.35rem;\n  width: 100%;\n  max-width: 100%;\n  box-sizing: border-box;\n  border: none;\n  border-radius: 0;\n  background: transparent;\n  color: var(--text);\n  font: inherit;\n  font-size: 0.8125rem;\n  line-height: 1.35;\n  text-align: center;\n  padding: 0.5rem var(--file-item-pad-x, 0.35rem);\n  cursor: pointer;\n}\n.file-view-thumb-wrap {\n  position: relative;\n  flex-shrink: 0;\n}\n.file-view-close {\n  position: absolute;\n  top: -0.25rem;\n  right: -0.25rem;\n  appearance: none;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 1rem;\n  height: 1rem;\n  padding: 0;\n  border: 1px solid var(--border);\n  border-radius: 50%;\n  background: var(--bg);\n  color: var(--muted);\n  font: inherit;\n  font-size: 0.75rem;\n  line-height: 1;\n  cursor: pointer;\n  box-shadow: 0 1px 2px rgb(0 0 0 / 8%);\n  z-index: 1;\n}\n.file-view-close:hover {\n  color: var(--text);\n  background: var(--panel);\n}\n.file-view-close:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: 1px;\n}\n.file-view-thumb {\n  flex-shrink: 0;\n  width: var(--file-thumb-size, 3.75rem);\n  height: var(--file-thumb-size, 3.75rem);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: var(--placeholder-bg);\n  border: 1px solid var(--border);\n  border-radius: 0.25rem;\n  overflow: hidden;\n}\n.file-view-thumb img {\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n}\n.file-view-thumb-placeholder {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 100%;\n  color: var(--muted);\n}\n.file-view-thumb-placeholder svg {\n  display: block;\n  width: 1.875rem;\n  height: 1.875rem;\n}\n.file-view-label {\n  width: 100%;\n  max-width: 100%;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.file-view-item:hover {\n  background: var(--markup-hover);\n}\n.file-view-item.is-active {\n  background: var(--markup-selected);\n  color: var(--accent);\n  font-weight: 500;\n}\n.file-view-item:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: -2px;\n}\n";
	//#endregion
	//#region src/components/file-pane/file-pane.ts
	/** <doclang-file-pane> — file list sidebar */
	var FILE_THUMB_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
	var DoclangFilePane = class DoclangFilePane extends i$3 {
		static styles = r$6(file_pane_default);
		_entries = [];
		connectedCallback() {
			super.connectedCallback();
			this.classList.add("pane", "pane-file");
		}
		render() {
			const hasEntries = this._entries.length > 0;
			return b`
      <div class="pane-header">
        <span class="pane-header-title">Files</span>
        ${hasEntries ? b`<button
          type="button"
          class="file-pane-close-all"
          aria-label="Clear all open files"
          @click=${this._onCloseAll}
        >
          Clear
        </button>` : A}
      </div>
      <div class="pane-body">${hasEntries ? b`
          <ul class="file-view-list" role="listbox" aria-label="Open files">
            ${c(this._entries, (_, i) => i, this._renderEntry)}
          </ul>
        ` : A}</div>
    `;
		}
		setVisible(visible) {
			this.hidden = !visible;
		}
		setLastPane(isLast) {
			this.classList.toggle("pane-layout-last", isLast);
		}
		renderFiles(entries) {
			this._entries = entries;
			this.requestUpdate();
		}
		_onCloseAll = () => {
			this.dispatchEvent(new CustomEvent("doclang-file-pane-close-all", {
				bubbles: true,
				composed: true
			}));
		};
		_renderEntry = (entry, index) => {
			const onCardClick = (e) => {
				if (e.target.closest(".file-view-close")) return;
				this._emitFileSelect(index);
			};
			const onCardKeydown = (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					this._emitFileSelect(index);
				}
			};
			const onCloseClick = (e) => {
				e.stopPropagation();
				this._emitFileClose(index);
			};
			const thumb = entry.thumbnailUrl ? b`<img src=${entry.thumbnailUrl} alt="" />` : b`<span
          class="file-view-thumb-placeholder"
          .innerHTML=${FILE_THUMB_PLACEHOLDER_SVG}
        ></span>`;
			return b`
      <li>
        <div
          class="file-view-item${entry.isActive ? " is-active" : ""}"
          title=${entry.label}
          tabindex="0"
          role="option"
          aria-selected=${entry.isActive ? "true" : "false"}
          @click=${onCardClick}
          @keydown=${onCardKeydown}
        >
          <div class="file-view-thumb-wrap">
            <span class="file-view-thumb" aria-hidden="true">${thumb}</span>
            <button
              type="button"
              class="file-view-close"
              aria-label="Close ${entry.label}"
              @click=${onCloseClick}
            >
              ×
            </button>
          </div>
          <span class="file-view-label">${entry.label}</span>
        </div>
      </li>
    `;
		};
		_emitFileSelect(index) {
			this.dispatchEvent(new CustomEvent("doclang-file-select", {
				bubbles: true,
				composed: true,
				detail: { index }
			}));
		}
		_emitFileClose(index) {
			this.dispatchEvent(new CustomEvent("doclang-file-close", {
				bubbles: true,
				composed: true,
				detail: { index }
			}));
		}
	};
	DoclangFilePane = __decorate([t$2("doclang-file-pane")], DoclangFilePane);
	//#endregion
	//#region src/doclang/dom.ts
	function isTextLikeNode(node) {
		return node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE;
	}
	function isWhitespaceOnlyText(node) {
		return isTextLikeNode(node) && !node.textContent?.trim();
	}
	function markupAttributes(el) {
		return [...el.attributes].filter((a) => a.name !== "xmlns" || a.value !== "https://www.doclang.ai/ns/v0").map((a) => ({
			name: a.name,
			value: a.value
		}));
	}
	function childElements(el) {
		return [...el.children];
	}
	function localName(el) {
		return el.localName || el.tagName.replace(/^.*:/, "");
	}
	function headLocations(el) {
		return parseElementHeadAt([...el.childNodes], 0)?.locs ?? [];
	}
	function parseElementHeadAt(nodes, startIdx) {
		const locs = [];
		let i = startIdx;
		while (i < nodes.length) {
			const node = nodes[i];
			if (!node) {
				i += 1;
				continue;
			}
			if (node.nodeType !== Node.ELEMENT_NODE) {
				i += 1;
				continue;
			}
			const tag = localName(node);
			if (tag === "location") {
				locs.push(node);
				i += 1;
				if (locs.length === 4) return {
					locs,
					nextIndex: i
				};
				continue;
			}
			if (locs.length) break;
			if (HEAD_TAGS.has(tag)) {
				i += 1;
				continue;
			}
			break;
		}
		return locs.length === 4 ? {
			locs,
			nextIndex: i
		} : null;
	}
	function walkElements(nodes, fn) {
		for (let i = 0; i < nodes.length; i += 1) {
			const node = nodes[i];
			if (!node || node.nodeType !== Node.ELEMENT_NODE) continue;
			fn(node);
			walkElements(childElements(node), fn);
		}
	}
	function isCellToken(tag) {
		return CELL_TOKENS.has(tag);
	}
	function isListOrOtslContainer(el) {
		const tag = localName(el);
		return tag === "list" || OTSL_CONTAINER_TAGS.has(tag);
	}
	function skipContainerLevelHead(nodes, startIdx) {
		let i = startIdx;
		while (i < nodes.length) {
			const node = nodes[i];
			if (!node) {
				i += 1;
				continue;
			}
			if (node.nodeType !== Node.ELEMENT_NODE) {
				i += 1;
				continue;
			}
			const tag = localName(node);
			if (tag === "ldiv" || isCellToken(tag)) break;
			if (HEAD_TAGS.has(tag) || tag === "location") {
				i += 1;
				continue;
			}
			break;
		}
		return i;
	}
	function skipUntilListItemBoundary(nodes, startIdx) {
		let i = startIdx;
		while (i < nodes.length) {
			const node = nodes[i];
			if (node && node.nodeType === Node.ELEMENT_NODE && localName(node) === "ldiv") break;
			i += 1;
		}
		return i;
	}
	function skipUntilCellBoundary(nodes, startIdx) {
		let i = startIdx;
		while (i < nodes.length) {
			const node = nodes[i];
			if (node && node.nodeType === Node.ELEMENT_NODE && isCellToken(localName(node))) break;
			i += 1;
		}
		return i;
	}
	function locationResolution(el, axisDefault) {
		const r = parseInt(el.getAttribute("resolution") ?? String(axisDefault), 10);
		return Number.isFinite(r) && r > 0 ? r : axisDefault;
	}
	function headingLevel(el) {
		return Math.min(Math.max(parseInt(el.getAttribute("level") ?? "1", 10) || 1, 1), 6);
	}
	function firstHeadChild(el, tag) {
		return childElements(el).find((child) => localName(child) === tag) ?? null;
	}
	function xmlContains(target, ancestor) {
		let node = target;
		while (node) {
			if (node === ancestor) return true;
			node = node.parentNode;
		}
		return false;
	}
	function formatMarkupTextNode(node) {
		if (node.nodeType === Node.CDATA_SECTION_NODE) return `<![CDATA[${node.textContent ?? ""}]]>`;
		return node.textContent?.trim() ?? "";
	}
	function serializeMarkupTextNodes(nodes) {
		return Array.from(nodes).filter((n) => isTextLikeNode(n) && !isWhitespaceOnlyText(n)).map(formatMarkupTextNode).join("");
	}
	function escapeHtml(text) {
		return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}
	function normalizeArchivePath(path) {
		return path.replace(/\\/g, "/").replace(/^\.\//, "");
	}
	function archiveRelativeAssetPath(path) {
		const norm = normalizeArchivePath(path);
		const idx = norm.indexOf("assets/");
		return idx === -1 ? null : norm.slice(idx);
	}
	function skipOtslContainerHead(nodes, startIdx) {
		let i = startIdx;
		while (i < nodes.length) {
			const node = nodes[i];
			if (!node) {
				i += 1;
				continue;
			}
			if (node.nodeType !== Node.ELEMENT_NODE) {
				i += 1;
				continue;
			}
			const tag = localName(node);
			if (isCellToken(tag)) break;
			if (HEAD_TAGS.has(tag) || tag === "h_thread" || tag === "location") {
				i += 1;
				continue;
			}
			break;
		}
		return i;
	}
	function skipElementHeadNodes(nodes, startIdx) {
		let i = startIdx;
		while (i < nodes.length && isWhitespaceOnlyText(nodes[i])) i += 1;
		while (i < nodes.length) {
			const node = nodes[i];
			if (node && node.nodeType === Node.ELEMENT_NODE && HEAD_TAGS.has(localName(node))) {
				i += 1;
				while (i < nodes.length && isWhitespaceOnlyText(nodes[i])) i += 1;
				continue;
			}
			break;
		}
		return i;
	}
	function isSemanticElement(el) {
		return SEMANTIC_TAGS.has(localName(el));
	}
	function isVirtualTextHost(el) {
		const tag = localName(el);
		return tag === "ldiv" || CELL_CONTENT_TAGS.has(tag);
	}
	function elementThreadId(el) {
		return firstHeadChild(el, "thread")?.getAttribute("thread_id") ?? null;
	}
	function elementLayer(el) {
		const layerEl = firstHeadChild(el, "layer");
		if (layerEl) {
			const value = layerEl.getAttribute("value") ?? "body";
			return ELEMENT_LAYERS.has(value) ? value : "body";
		}
		if (headLocations(el).length === 4) return "body";
		const parent = el.parentElement;
		if (!parent) return "body";
		const nodes = [...parent.childNodes];
		const idx = nodes.indexOf(el);
		if (idx < 0) return "body";
		return layerFromHeadNodes(nodes, idx + 1);
	}
	function layerFromHeadNodes(nodes, startIdx) {
		let i = startIdx;
		while (i < nodes.length) {
			const node = nodes[i];
			if (!node) {
				i += 1;
				continue;
			}
			if (node.nodeType !== Node.ELEMENT_NODE) {
				i += 1;
				continue;
			}
			const tag = localName(node);
			if (tag === "layer") {
				const value = node.getAttribute("value") ?? "body";
				return ELEMENT_LAYERS.has(value) ? value : "body";
			}
			if (tag === "location") break;
			if (HEAD_TAGS.has(tag)) {
				i += 1;
				continue;
			}
			break;
		}
		return "body";
	}
	function layerClassForValue(layer) {
		if (layer === "furniture") return "layer-furniture";
		if (layer === "background") return "layer-background";
		return "";
	}
	function elementLabel(el) {
		if (isVirtualTextOverlayUnit(el)) return "text";
		const tag = localName(el);
		if (tag === "heading" || tag === "field_heading") return `${tag}[${headingLevel(el)}]`;
		const level = el.getAttribute("level");
		if (level) return `${tag}[${level}]`;
		const cls = el.getAttribute("class");
		if (cls) return `${tag}.${cls}`;
		return tag;
	}
	function isVirtualTextOverlayUnit(el) {
		if (headLocations(el).length === 4) return false;
		if (!hasVirtualTextLocations(el)) return false;
		const tag = localName(el);
		if (tag === "ldiv" && el.parentElement && localName(el.parentElement) === "list") return true;
		if (isCellToken(tag) && tag !== "nl" && !CELL_SPAN_TAGS.has(tag)) return el.parentElement ? OTSL_CONTAINER_TAGS.has(localName(el.parentElement)) : false;
		return false;
	}
	function hasVirtualTextLocations(el) {
		const parent = el.parentElement;
		if (!parent) return false;
		const nodes = [...parent.childNodes];
		const idx = nodes.indexOf(el);
		if (idx < 0) return false;
		return parseElementHeadAt(nodes, idx + 1) !== null;
	}
	function virtualTextHeadLocations(el) {
		const parent = el.parentElement;
		if (!parent) return [];
		const nodes = [...parent.childNodes];
		const idx = nodes.indexOf(el);
		if (idx < 0) return [];
		return parseElementHeadAt(nodes, idx + 1)?.locs ?? [];
	}
	function elementHeadLocations(el) {
		const own = headLocations(el);
		return own.length === 4 ? own : virtualTextHeadLocations(el);
	}
	function isPictureContentElement(el) {
		if (!el) return false;
		const tag = localName(el);
		if (tag === "picture" || tag === "caption") return false;
		let node = el.parentElement;
		while (node) {
			if (localName(node) === "picture") return true;
			node = node.parentElement;
		}
		return false;
	}
	function isTableContentElement(el) {
		if (!el) return false;
		const tag = localName(el);
		if (OTSL_CONTAINER_TAGS.has(tag) || tag === "caption") return false;
		let node = el.parentElement;
		while (node) {
			if (OTSL_CONTAINER_TAGS.has(localName(node))) return true;
			node = node.parentElement;
		}
		return false;
	}
	var HEAD_TAGS, SEMANTIC_TAGS, CELL_TOKENS, CELL_CONTENT_TAGS, CELL_SPAN_TAGS, OTSL_CONTAINER_TAGS, ELEMENT_LAYERS;
	var init_dom = __esmMin((() => {
		HEAD_TAGS = /* @__PURE__ */ new Set([
			"label",
			"thread",
			"xref",
			"href",
			"layer",
			"location",
			"caption",
			"description",
			"summary",
			"custom"
		]);
		SEMANTIC_TAGS = /* @__PURE__ */ new Set([
			"text",
			"heading",
			"footnote",
			"page_header",
			"page_footer",
			"field_region",
			"list",
			"table",
			"index",
			"formula",
			"code",
			"picture",
			"marker",
			"group",
			"field_heading",
			"field_item",
			"key",
			"value",
			"hint",
			"caption",
			"page_break"
		]);
		CELL_TOKENS = /* @__PURE__ */ new Set([
			"fcel",
			"ecel",
			"ched",
			"rhed",
			"corn",
			"srow",
			"lcel",
			"ucel",
			"xcel",
			"nl"
		]);
		CELL_CONTENT_TAGS = /* @__PURE__ */ new Set([
			"fcel",
			"ecel",
			"ched",
			"rhed",
			"corn",
			"srow"
		]);
		CELL_SPAN_TAGS = /* @__PURE__ */ new Set([
			"lcel",
			"ucel",
			"xcel"
		]);
		OTSL_CONTAINER_TAGS = /* @__PURE__ */ new Set([
			"table",
			"index",
			"tabular"
		]);
		ELEMENT_LAYERS = /* @__PURE__ */ new Set([
			"body",
			"background",
			"furniture"
		]);
	}));
	//#endregion
	//#region src/doclang/zip.ts
	async function unzip(buffer, { shouldExtract } = {}) {
		if (typeof DecompressionStream === "undefined") throw new Error("ZIP decompression requires a browser with DecompressionStream support");
		const bytes = new Uint8Array(buffer);
		const view = new DataView(buffer);
		const eocdOffset = findEndOfCentralDirectory(bytes);
		const entryCount = view.getUint16(eocdOffset + 10, true);
		const centralDirOffset = view.getUint32(eocdOffset + 16, true);
		if (entryCount > ZIP_MAX_ENTRIES) throw new Error("ZIP archive has too many entries");
		if (centralDirOffset >= bytes.length) throw new Error("Invalid ZIP central directory offset");
		const entries = [];
		let offset = centralDirOffset;
		let totalUncompressed = 0;
		for (let i = 0; i < entryCount; i += 1) {
			if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 33639248) throw new Error("Invalid ZIP central directory");
			const compression = view.getUint16(offset + 10, true);
			const compressedSize = view.getUint32(offset + 20, true);
			const uncompressedSize = view.getUint32(offset + 24, true);
			const nameLength = view.getUint16(offset + 28, true);
			const extraLength = view.getUint16(offset + 30, true);
			const commentLength = view.getUint16(offset + 32, true);
			const localHeaderOffset = view.getUint32(offset + 42, true);
			const nameEnd = offset + 46 + nameLength;
			if (nameEnd > bytes.length) throw new Error("Invalid ZIP entry name");
			const name = normalizeZipEntryName(new TextDecoder().decode(bytes.subarray(offset + 46, nameEnd)));
			offset = nameEnd + extraLength + commentLength;
			if (offset > bytes.length) throw new Error("Invalid ZIP central directory");
			if (!name || name.endsWith("/") || isIgnoredArchiveEntry(name)) continue;
			if (shouldExtract && !shouldExtract(name)) continue;
			if (compressedSize > ZIP_MAX_ENTRY_COMPRESSED_BYTES || uncompressedSize > ZIP_MAX_ENTRY_UNCOMPRESSED_BYTES) throw new Error(`ZIP entry exceeds size limit: ${name}`);
			if (compressedSize > 0 && uncompressedSize > 0 && uncompressedSize / compressedSize > ZIP_MAX_COMPRESSION_RATIO) throw new Error(`ZIP entry compression ratio exceeds limit: ${name}`);
			if (totalUncompressed + uncompressedSize > ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES) throw new Error("ZIP archive exceeds total uncompressed size limit");
			if (localHeaderOffset + 30 > bytes.length || view.getUint32(localHeaderOffset, true) !== 67324752) throw new Error(`Invalid ZIP local header: ${name}`);
			const localNameLength = view.getUint16(localHeaderOffset + 26, true);
			const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
			const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
			if (dataOffset + compressedSize > bytes.length) throw new Error(`ZIP entry data out of bounds: ${name}`);
			const data = await decompressZipEntry(bytes.subarray(dataOffset, dataOffset + compressedSize), compression, uncompressedSize);
			totalUncompressed += data.length;
			if (totalUncompressed > ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES) throw new Error("ZIP archive exceeds total uncompressed size limit");
			entries.push({
				name,
				data
			});
		}
		return entries;
	}
	function findEndOfCentralDirectory(bytes) {
		for (let i = bytes.length - 22; i >= 0; i -= 1) if (bytes[i] === 80 && bytes[i + 1] === 75 && bytes[i + 2] === 5 && bytes[i + 3] === 6) return i;
		throw new Error("Invalid ZIP archive");
	}
	function concatUint8Arrays(chunks, totalLength) {
		const out = new Uint8Array(totalLength);
		let offset = 0;
		for (const chunk of chunks) {
			out.set(chunk, offset);
			offset += chunk.byteLength;
		}
		return out;
	}
	async function decompressZipEntry(data, method, uncompressedSize) {
		if (method === 0) {
			if (data.length > ZIP_MAX_ENTRY_UNCOMPRESSED_BYTES) throw new Error("ZIP entry exceeds size limit");
			return data;
		}
		if (method === 8) {
			const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
			const chunks = [];
			let total = 0;
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					total += value.byteLength;
					if (total > ZIP_MAX_ENTRY_UNCOMPRESSED_BYTES) throw new Error("ZIP entry exceeds size limit");
					if (data.length > 0 && total / data.length > ZIP_MAX_COMPRESSION_RATIO) throw new Error("ZIP entry compression ratio exceeds limit");
					chunks.push(value);
				}
			} catch (err) {
				try {
					await reader.cancel();
				} catch {}
				throw err;
			}
			const out = concatUint8Arrays(chunks, total);
			if (uncompressedSize && out.length !== uncompressedSize) return out.slice(0, Math.min(out.length, uncompressedSize));
			return out;
		}
		throw new Error(`Unsupported ZIP compression method ${method}`);
	}
	function normalizeZipEntryName(name) {
		return name.replace(/\\/g, "/").replace(/^\.\//, "");
	}
	function findArchiveEntry(entries, fileName) {
		return entries.find((e) => e.name === fileName);
	}
	function isIgnoredArchiveEntry(name) {
		if (name === ".DS_Store" || name.endsWith("/.DS_Store")) return true;
		return name.split("/").some((part) => part.startsWith("._") || part === "__MACOSX");
	}
	async function extractArchiveFromZipBuffer(buffer) {
		const entries = await unzip(buffer);
		const markupEntry = findArchiveEntry(entries, "document.xml");
		if (!markupEntry) throw new Error("Archive must contain document.xml");
		const markupXml = new TextDecoder().decode(markupEntry.data);
		const pageImages = /* @__PURE__ */ new Map();
		const assetUrls = /* @__PURE__ */ new Map();
		for (const e of entries) {
			const m = e.name.match(/^pages\/(\d+)\.(png|jpe?g|webp)$/i);
			if (m) {
				const ext = m[2].toLowerCase().replace("jpeg", "jpg");
				const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
				pageImages.set(Number(m[1]), URL.createObjectURL(new Blob([e.data], { type: mime })));
				continue;
			}
			if (e.name.startsWith("assets/") && !e.name.endsWith("/")) assetUrls.set(e.name, URL.createObjectURL(new Blob([e.data], { type: mimeFromAssetPath(e.name) })));
		}
		return {
			markupXml,
			pageImages,
			assetUrls
		};
	}
	function mimeFromAssetPath(path) {
		switch (path.split(".").pop()?.toLowerCase() ?? "") {
			case "png": return "image/png";
			case "jpg":
			case "jpeg": return "image/jpeg";
			case "webp": return "image/webp";
			case "gif": return "image/gif";
			case "svg": return "image/svg+xml";
			default: return "application/octet-stream";
		}
	}
	var ZIP_MAX_ENTRIES, ZIP_MAX_ENTRY_COMPRESSED_BYTES, ZIP_MAX_ENTRY_UNCOMPRESSED_BYTES, ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES, ZIP_MAX_COMPRESSION_RATIO;
	var init_zip = __esmMin((() => {
		ZIP_MAX_ENTRIES = 5e3;
		ZIP_MAX_ENTRY_COMPRESSED_BYTES = 134217728;
		ZIP_MAX_ENTRY_UNCOMPRESSED_BYTES = 134217728;
		ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES = 536870912;
		ZIP_MAX_COMPRESSION_RATIO = 100;
	}));
	//#endregion
	//#region src/doclang/document.ts
	var document_exports = /* @__PURE__ */ __exportAll({
		NO_MARKUP: () => NO_MARKUP,
		PAGE_IMAGE_RE: () => PAGE_IMAGE_RE,
		assignElementIds: () => assignElementIds,
		buildDocumentState: () => buildDocumentState,
		buildElementPageMap: () => buildElementPageMap,
		buildThreadNavByElement: () => buildThreadNavByElement,
		buildThreadPagesById: () => buildThreadPagesById,
		collectBoundingBoxes: () => collectBoundingBoxes,
		collectCaptionLinks: () => collectCaptionLinks,
		collectFragmentLinks: () => collectFragmentLinks,
		collectFragmentNavItems: () => collectFragmentNavItems,
		collectReadingOrderSteps: () => collectReadingOrderSteps,
		collectXrefLinks: () => collectXrefLinks,
		computeReadingOrder: () => computeReadingOrder,
		computeReadingOrderDisplayNumbers: () => computeReadingOrderDisplayNumbers,
		extractArchiveFromFiles: () => extractArchiveFromFiles,
		extractArchiveFromZipBuffer: () => extractArchiveFromZipBuffer,
		invertElementIds: () => invertElementIds,
		readDefaultResolution: () => readDefaultResolution,
		revokeDocumentState: () => revokeDocumentState,
		segmentHasMarkup: () => segmentHasMarkup,
		serializeSegment: () => serializeSegment,
		splitIntoSegments: () => splitIntoSegments
	});
	function splitIntoSegments(root) {
		const body = childElements(root).filter((el) => localName(el) !== "head");
		const segments = [[]];
		for (const el of body) if (localName(el) === "page_break") segments.push([]);
		else segments[segments.length - 1].push(el);
		return segments.length ? segments : [[]];
	}
	function segmentHasMarkup(segment) {
		return segment.some((el) => el.nodeType === Node.ELEMENT_NODE);
	}
	function readDefaultResolution(head) {
		const fallback = {
			width: 512,
			height: 512
		};
		if (!head) return fallback;
		const dr = childElements(head).find((el) => localName(el) === "default_resolution");
		if (!dr) return fallback;
		const w = parseInt(dr.getAttribute("width") ?? "512", 10);
		const h = parseInt(dr.getAttribute("height") ?? "512", 10);
		return {
			width: Number.isFinite(w) && w > 0 ? w : 512,
			height: Number.isFinite(h) && h > 0 ? h : 512
		};
	}
	function assignElementIds(segment) {
		const ids = /* @__PURE__ */ new Map();
		let counter = 0;
		walkElements(segment, (el) => {
			ids.set(el, `el-${counter++}`);
		});
		return ids;
	}
	function invertElementIds(elementIds) {
		const idToElement = /* @__PURE__ */ new Map();
		for (const [el, id] of elementIds) idToElement.set(id, el);
		return idToElement;
	}
	function buildThreadsById(docRoot) {
		const map = /* @__PURE__ */ new Map();
		walkElements(childElements(docRoot).filter((el) => localName(el) !== "head"), (el) => {
			for (const child of childElements(el)) {
				if (localName(child) !== "thread") continue;
				const threadId = child.getAttribute("thread_id");
				if (!threadId) continue;
				if (!map.has(threadId)) map.set(threadId, []);
				map.get(threadId).push(el);
			}
		});
		return map;
	}
	function buildElementPageMap(segments) {
		const elementPage = /* @__PURE__ */ new Map();
		segments.forEach((segment, idx) => {
			const pageNum = idx + 1;
			walkElements(segment, (el) => elementPage.set(el, pageNum));
		});
		return elementPage;
	}
	function buildThreadPagesById(docRoot, elementPageByEl) {
		const threadPagesById = /* @__PURE__ */ new Map();
		for (const [threadId, elements] of buildThreadsById(docRoot)) {
			const pages = /* @__PURE__ */ new Set();
			for (const el of elements) {
				const page = elementPageByEl.get(el);
				if (page) pages.add(page);
			}
			if (pages.size) threadPagesById.set(threadId, pages);
		}
		return threadPagesById;
	}
	function buildThreadNavByElement(docRoot) {
		const nav = /* @__PURE__ */ new Map();
		for (const [, elements] of buildThreadsById(docRoot)) for (let i = 0; i < elements.length; i += 1) nav.set(elements[i], {
			prev: i > 0 ? elements[i - 1] : null,
			next: i < elements.length - 1 ? elements[i + 1] : null
		});
		return nav;
	}
	function isReadingOrderUnit(el) {
		const tag = localName(el);
		if (tag === "caption") return true;
		if (HEAD_TAGS.has(tag) || tag === "location" || tag === "h_thread" || tag === "page_break") return false;
		if (tag === "nl" || CELL_SPAN_TAGS.has(tag)) return false;
		if (RENDER_FORMAT_TAGS$1.has(tag) || tag === "src" || tag === "checkbox") return false;
		return true;
	}
	function computeReadingOrder(docRoot) {
		const bodyChildren = childElements(docRoot).filter((el) => localName(el) !== "head");
		const threadsById = buildThreadsById(docRoot);
		const consumedViaXref = /* @__PURE__ */ new Set();
		const order = [];
		function record(el) {
			if (!isReadingOrderUnit(el)) return;
			order.push(el);
		}
		function consumeThread(threadId) {
			for (const target of threadsById.get(threadId) ?? []) {
				if (consumedViaXref.has(target)) continue;
				consumedViaXref.add(target);
				visitElement(target);
			}
		}
		function walkChildren(parent) {
			for (const child of parent.childNodes) {
				if (child.nodeType !== Node.ELEMENT_NODE) continue;
				const el = child;
				const tag = localName(el);
				if (tag === "xref") {
					const threadId = el.getAttribute("thread_id");
					if (threadId) consumeThread(threadId);
					continue;
				}
				if (tag === "page_break") continue;
				visitElement(el);
			}
		}
		function visitElement(el) {
			record(el);
			walkChildren(el);
		}
		for (const el of bodyChildren) {
			if (localName(el) === "page_break") continue;
			if (consumedViaXref.has(el)) continue;
			visitElement(el);
		}
		return order;
	}
	function isReadingOrderOverlayUnit(el) {
		if (!isReadingOrderUnit(el)) return false;
		if (isPictureContentElement(el) || isTableContentElement(el)) return false;
		if (headLocations(el).length === 4) return true;
		return isVirtualTextOverlayUnit(el);
	}
	function computeReadingOrderDisplayNumbers(readingOrder) {
		const numbers = /* @__PURE__ */ new Map();
		let n = 0;
		for (const el of readingOrder) {
			if (!isReadingOrderOverlayUnit(el)) continue;
			n += 1;
			numbers.set(el, n);
		}
		return numbers;
	}
	function pushBoundingBox(boxes, locs, defaultResolution, kind, tag, elementId, layer = "body") {
		const [x0el, y0el, x1el, y1el] = locs;
		const resW = locationResolution(x0el, defaultResolution.width);
		const resH = locationResolution(y0el, defaultResolution.height);
		boxes.push({
			kind,
			tag,
			elementId,
			layer,
			x0: parseInt(x0el.getAttribute("value") ?? "0", 10),
			y0: parseInt(y0el.getAttribute("value") ?? "0", 10),
			x1: parseInt(x1el.getAttribute("value") ?? "0", 10),
			y1: parseInt(y1el.getAttribute("value") ?? "0", 10),
			resW,
			resH
		});
	}
	function collectListVirtualTextBoxes(list, defaultResolution, boxes, elementIds) {
		const nodes = [...list.childNodes];
		let i = skipContainerLevelHead(nodes, 0);
		while (i < nodes.length) {
			const node = nodes[i];
			if (node.nodeType !== Node.ELEMENT_NODE || localName(node) !== "ldiv") {
				i += 1;
				continue;
			}
			i += 1;
			const head = parseElementHeadAt(nodes, i);
			if (head) {
				const elementId = elementIds.get(node);
				if (elementId) pushBoundingBox(boxes, head.locs, defaultResolution, "text", "text", elementId, elementLayer(node));
				i = head.nextIndex;
			}
			i = skipUntilListItemBoundary(nodes, i);
		}
	}
	function collectTableVirtualTextBoxes(container, defaultResolution, boxes, elementIds) {
		const nodes = [...container.childNodes];
		let i = skipContainerLevelHead(nodes, 0);
		while (i < nodes.length) {
			const node = nodes[i];
			if (node.nodeType !== Node.ELEMENT_NODE) {
				i += 1;
				continue;
			}
			const tag = localName(node);
			if (!isCellToken(tag)) {
				i += 1;
				continue;
			}
			if (tag === "nl") {
				i += 1;
				continue;
			}
			i += 1;
			const head = parseElementHeadAt(nodes, i);
			if (head) {
				const elementId = elementIds.get(node);
				if (elementId) pushBoundingBox(boxes, head.locs, defaultResolution, "text", "text", elementId, elementLayer(node));
				i = head.nextIndex;
			}
			i = skipUntilCellBoundary(nodes, i);
		}
	}
	function collectBoundingBoxes(segment, defaultResolution, elementIds) {
		const boxes = [];
		walkElements(segment, (el) => {
			const locs = headLocations(el);
			if (locs.length !== 4) return;
			const elementId = elementIds.get(el);
			if (!elementId) return;
			pushBoundingBox(boxes, locs, defaultResolution, localName(el), elementLabel(el), elementId, elementLayer(el));
		});
		walkElements(segment, (el) => {
			const tag = localName(el);
			if (tag === "list") collectListVirtualTextBoxes(el, defaultResolution, boxes, elementIds);
			else if (OTSL_CONTAINER_TAGS.has(tag)) collectTableVirtualTextBoxes(el, defaultResolution, boxes, elementIds);
		});
		return boxes;
	}
	function collectCaptionLinks(segment, elementIds, boxes) {
		const boxById = new Map(boxes.map((b) => [b.elementId, b]));
		const links = [];
		walkElements(segment, (el) => {
			if (localName(el) !== "caption") return;
			const captionId = elementIds.get(el);
			const captionBox = captionId ? boxById.get(captionId) : null;
			if (!captionBox) return;
			const host = el.parentElement;
			if (!host || headLocations(host).length !== 4) return;
			const hostId = elementIds.get(host);
			const hostBox = hostId ? boxById.get(hostId) : null;
			if (!hostBox) return;
			links.push({
				captionBox,
				hostBox,
				captionElementId: captionId,
				hostElementId: hostId
			});
		});
		return links;
	}
	function collectXrefLinks(segment, elementIds, boxes) {
		const boxById = new Map(boxes.map((b) => [b.elementId, b]));
		const threadsById = /* @__PURE__ */ new Map();
		walkElements(segment, (el) => {
			const elementId = elementIds.get(el);
			const box = elementId ? boxById.get(elementId) : null;
			if (!box) return;
			for (const thread of childElements(el)) {
				if (localName(thread) !== "thread") continue;
				const threadId = thread.getAttribute("thread_id");
				if (!threadId) continue;
				if (!threadsById.has(threadId)) threadsById.set(threadId, []);
				threadsById.get(threadId).push({
					elementId,
					box
				});
			}
		});
		const links = [];
		walkElements(segment, (el) => {
			const xrefs = childElements(el).filter((c) => localName(c) === "xref");
			if (!xrefs.length) return;
			const from = findNearestLocatedBox(el, elementIds, boxById);
			if (!from) return;
			for (const xref of xrefs) {
				const threadId = xref.getAttribute("thread_id");
				if (!threadId) continue;
				for (const { elementId: toId, box: toBox } of threadsById.get(threadId) ?? []) {
					if (toId === from.elementId) continue;
					links.push({
						fromBox: from.box,
						toBox,
						fromElementId: from.elementId,
						toElementId: toId
					});
				}
			}
		});
		return links;
	}
	function findNearestLocatedBox(el, elementIds, boxById) {
		let node = el;
		while (node) {
			const elementId = elementIds.get(node);
			const box = elementId ? boxById.get(elementId) : null;
			if (box) return {
				elementId,
				box
			};
			if (localName(node) === "doclang") break;
			node = node.parentElement;
		}
		return null;
	}
	function collectFragmentLinks(segment, elementIds, boxes, pageNum, threadPagesById) {
		const boxById = new Map(boxes.map((b) => [b.elementId, b]));
		const onPage = /* @__PURE__ */ new Map();
		walkElements(segment, (el) => {
			const threadId = firstHeadChild(el, "thread")?.getAttribute("thread_id");
			if (!threadId) return;
			const elementId = elementIds.get(el);
			const box = elementId ? boxById.get(elementId) : null;
			if (!box) return;
			if (!onPage.has(threadId)) onPage.set(threadId, []);
			onPage.get(threadId).push({
				elementId,
				box
			});
		});
		const links = [];
		for (const [threadId, members] of onPage) {
			if (members.length >= 2) {
				for (let i = 0; i < members.length - 1; i += 1) links.push({
					fromBox: members[i].box,
					toBox: members[i + 1].box,
					fromElementId: members[i].elementId,
					toElementId: members[i + 1].elementId,
					threadId
				});
				continue;
			}
			if (members.length !== 1) continue;
			const threadPages = threadPagesById.get(threadId);
			if (!threadPages) continue;
			const hasPrevious = [...threadPages].some((p) => p < pageNum);
			const hasFollowing = [...threadPages].some((p) => p > pageNum);
			if (!hasPrevious && !hasFollowing) continue;
			const base = {
				fromBox: members[0].box,
				toBox: null,
				fromElementId: members[0].elementId,
				toElementId: null,
				threadId
			};
			if (hasPrevious) links.push({
				...base,
				targetCorner: "tl"
			});
			if (hasFollowing) links.push({
				...base,
				targetCorner: "br"
			});
		}
		return links;
	}
	function collectFragmentNavItems(segment, elementIds, boxes, threadNavByElement) {
		const boxById = new Map(boxes.map((b) => [b.elementId, b]));
		const items = [];
		walkElements(segment, (el) => {
			const nav = threadNavByElement.get(el);
			if (!nav || !nav.prev && !nav.next) return;
			const elementId = elementIds.get(el);
			const box = elementId ? boxById.get(elementId) : null;
			if (!box) return;
			items.push({
				elementId,
				box,
				hasPrev: nav.prev !== null,
				hasNext: nav.next !== null
			});
		});
		return items;
	}
	function collectReadingOrderSteps(segment, elementIds, boxes, readingOrder, globalNumbering = true, displayNumbers = null) {
		const boxById = new Map(boxes.map((b) => [b.elementId, b]));
		const steps = [];
		let pageOrder = 0;
		readingOrder.forEach((el) => {
			if (isPictureContentElement(el) || isTableContentElement(el)) return;
			const elementId = elementIds.get(el);
			if (!elementId) return;
			const box = boxById.get(elementId);
			if (!box) return;
			pageOrder += 1;
			steps.push({
				order: globalNumbering ? displayNumbers?.get(el) ?? pageOrder : pageOrder,
				box,
				elementId
			});
		});
		return steps;
	}
	function buildDocumentState(markupXml, pageImages, label, assetUrls, { markupOnly }) {
		const doc = new DOMParser().parseFromString(markupXml, "application/xml");
		if (doc.querySelector("parsererror")) {
			alert(`Invalid XML in ${label}`);
			return null;
		}
		const root = doc.documentElement;
		if (localName(root) !== "doclang") {
			alert(`${label}: root element must be <doclang>`);
			return null;
		}
		const defaultResolution = readDefaultResolution(childElements(root).find((el) => localName(el) === "head") ?? null);
		const segments = markupOnly ? [childElements(root).filter((el) => localName(el) !== "head")] : splitIntoSegments(root);
		const hasPageView = !markupOnly && pageImages.size > 0;
		const maxImagePage = hasPageView ? Math.max(...pageImages.keys()) : 0;
		const pageCount = markupOnly ? 1 : Math.max(segments.length, maxImagePage, 1);
		const readingOrder = computeReadingOrder(root);
		const elementPageByEl = buildElementPageMap(segments);
		return {
			pageImages,
			assetUrls,
			currentPage: 1,
			pageCount,
			segments,
			defaultResolution,
			elementIds: /* @__PURE__ */ new Map(),
			idToElement: /* @__PURE__ */ new Map(),
			hasPageView,
			markupOnly,
			docRoot: root,
			threadPagesById: buildThreadPagesById(root, elementPageByEl),
			elementPageByEl,
			threadNavByElement: buildThreadNavByElement(root),
			pendingSelectElement: null,
			readingOrder,
			readingOrderDisplayNumbers: computeReadingOrderDisplayNumbers(readingOrder),
			pageViewOverlay: null
		};
	}
	async function extractArchiveFromFiles(files) {
		const markupFile = files.find((f) => f.name === "document.xml");
		if (!markupFile) throw new Error("Archive must contain document.xml at its root.");
		const markupXml = await markupFile.text();
		const pageImages = /* @__PURE__ */ new Map();
		const assetUrls = /* @__PURE__ */ new Map();
		for (const f of files) {
			const relPath = f.webkitRelativePath || f.name;
			const parts = relPath.split("/");
			if (parts.length >= 2 && parts[parts.length - 2] === "pages") {
				const m = PAGE_IMAGE_RE.exec(f.name);
				if (m) pageImages.set(Number(m[1]), URL.createObjectURL(f));
			}
			const assetPath = archiveRelativeAssetPath(relPath);
			if (assetPath) assetUrls.set(assetPath, URL.createObjectURL(f));
		}
		return {
			markupXml,
			pageImages,
			assetUrls
		};
	}
	function revokeDocumentState(docState) {
		if (!docState) return;
		for (const url of docState.pageImages.values()) if (url.startsWith("blob:")) URL.revokeObjectURL(url);
		for (const url of docState.assetUrls.values()) if (url.startsWith("blob:")) URL.revokeObjectURL(url);
	}
	function serializeSegment(segment) {
		return segment.map((el) => serializeElement(el, 0)).join("\n");
	}
	function serializeElement(el, depth) {
		const pad = "  ".repeat(depth);
		const tag = localName(el);
		const attrs = [...el.attributes].filter((a) => a.name !== "xmlns" || a.value !== "https://www.doclang.ai/ns/v0").map((a) => `${a.name}="${a.value}"`).join(" ");
		const attrStr = attrs ? ` ${attrs}` : "";
		if (!el.childNodes.length) return `${pad}<${tag}${attrStr}/>`;
		const meaningfulText = [...el.childNodes].filter((n) => isTextLikeNode(n) && !isWhitespaceOnlyText(n));
		if (meaningfulText.length > 0 && meaningfulText.every(isTextLikeNode) && !childElements(el).length) {
			const text = serializeMarkupTextNodes(el.childNodes);
			if (text) return `${pad}<${tag}${attrStr}>${text}</${tag}>`;
		}
		const parts = [`${pad}<${tag}${attrStr}>`];
		for (const child of el.childNodes) if (isTextLikeNode(child)) {
			const text = formatMarkupTextNode(child);
			if (text) parts.push("  ".repeat(depth + 1) + text);
		} else if (child.nodeType === Node.ELEMENT_NODE) parts.push(serializeElement(child, depth + 1));
		parts.push(`${pad}</${tag}>`);
		return parts.join("\n");
	}
	var PAGE_IMAGE_RE, NO_MARKUP, RENDER_FORMAT_TAGS$1;
	var init_document = __esmMin((() => {
		init_dom();
		init_zip();
		PAGE_IMAGE_RE = /^(\d+)\.(png|jpe?g|webp)$/i;
		NO_MARKUP = "(No markup to be shown.)";
		RENDER_FORMAT_TAGS$1 = /* @__PURE__ */ new Set([
			"bold",
			"italic",
			"underline",
			"strikethrough",
			"superscript",
			"subscript",
			"handwriting",
			"rtl",
			"content"
		]);
	}));
	//#endregion
	//#region src/components/base/page-element.ts
	/**
	* Base class for doclang web components that render document content.
	*
	* Supports three ways to provide the DocLang document:
	*
	*   1. `src` attribute — a URL (http:, data:, blob:) pointing to either a
	*      raw XML markup string or a .dclx/.zip archive.  The component fetches
	*      and parses it automatically.
	*
	*   2. Inline child `<script type="application/doclang+xml">` — the XML is
	*      taken from the element's text content during `connectedCallback`.
	*
	*   3. `component.document = state` — set an already-parsed `DocumentState`
	*      directly via the JS property (fastest path, used by the viewer app).
	*
	* Once a document is available, `_renderDocument()` is called.  Subclasses
	* must implement that method.  They may also override `_clearDocument()` to
	* reset their view when the document is removed.
	*
	* The `page` attribute / property controls which page is rendered.  Setting
	* `page="3"` in HTML or `component.page = 3` in JS both trigger a re-render.
	*/
	init_document();
	init_dom();
	var DoclangPageElement = class extends i$3 {
		static get observedAttributes() {
			return [
				...super.observedAttributes,
				"src",
				"page",
				"selected"
			];
		}
		_docState = null;
		_currentPage = 1;
		_selectedId = null;
		_peerIds = /* @__PURE__ */ new Set();
		get document() {
			return this._docState;
		}
		set document(state) {
			this._docState = state;
			this._currentPage = state ? state.currentPage : 1;
			if (state) this._renderDocument();
			else this._clearDocument();
		}
		get selected() {
			return this._selectedId;
		}
		set selected(id) {
			if (id === this._selectedId) return;
			this._selectedId = id;
			this._peerIds = id ? this._computePeerIds(id) : /* @__PURE__ */ new Set();
			if (id) this.setAttribute("selected", id);
			else this.removeAttribute("selected");
			this._applySelection();
		}
		get page() {
			return this._currentPage;
		}
		set page(n) {
			if (!this._docState) return;
			const p = Math.min(Math.max(1, n), this._docState.pageCount);
			if (p === this._currentPage) return;
			this._currentPage = p;
			this._docState.currentPage = p;
			this.setAttribute("page", String(p));
			this._renderDocument();
		}
		connectedCallback() {
			super.connectedCallback();
			if (!this._docState && !this.hasAttribute("src")) {
				const script = this.querySelector("script[type=\"application/doclang+xml\"]");
				if (script?.textContent?.trim()) this._loadXmlString(script.textContent.trim(), this.getAttribute("label") ?? "");
			}
		}
		attributeChangedCallback(name, _old, next) {
			super.attributeChangedCallback(name, _old, next);
			if (name === "src" && next) this._loadFromUrl(next);
			if (name === "page" && next) {
				const n = parseInt(next, 10);
				if (!isNaN(n)) this.page = n;
			}
			if (name === "selected") this.selected = next || null;
		}
		/** Called when the selected element changes. Default: no-op. */
		_applySelection() {}
		/** Called when the document is removed (set to null). Default: no-op. */
		_clearDocument() {}
		_computePeerIds(elementId) {
			const peers = /* @__PURE__ */ new Set();
			if (!this._docState?.elementIds || !this._docState.idToElement) return peers;
			const el = this._docState.idToElement.get(elementId);
			const threadId = el ? elementThreadId(el) : null;
			if (!threadId) return peers;
			for (const [node, id] of this._docState.elementIds) if (elementThreadId(node) === threadId) peers.add(id);
			return peers;
		}
		_loadXmlString(xml, label) {
			const state = buildDocumentState(xml, /* @__PURE__ */ new Map(), label, /* @__PURE__ */ new Map(), { markupOnly: true });
			if (state) this.document = state;
		}
		async _loadFromUrl(url) {
			try {
				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				if (url.includes(".dclx") || url.includes(".zip") || res.headers.get("content-type")?.includes("zip")) {
					const { extractArchiveFromZipBuffer } = await Promise.resolve().then(() => (init_document(), document_exports));
					const { markupXml, pageImages, assetUrls } = await extractArchiveFromZipBuffer(await res.arrayBuffer());
					const state = buildDocumentState(markupXml, pageImages, url.split("/").pop() ?? "", assetUrls, { markupOnly: false });
					if (state) this.document = state;
				} else {
					const xml = await res.text();
					const label = url.split("/").pop() ?? "";
					this._loadXmlString(xml, label);
				}
			} catch (err) {
				this.dispatchEvent(new CustomEvent("doclang-load-error", {
					bubbles: true,
					composed: true,
					detail: { error: err }
				}));
			}
		}
	};
	//#endregion
	//#region src/components/markup-pane/markup-pane.css?inline
	var markup_pane_default = ":host {\n  display: flex;\n  flex-direction: column;\n  border-right: 1px solid var(--border);\n  min-height: 0;\n  min-width: 0;\n}\n:host([hidden]) {\n  display: none !important;\n}\n:host(.pane-layout-last) {\n  border-right: none;\n}\n.pane-header {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  box-sizing: border-box;\n  height: 2.125rem;\n  padding: 0 0.75rem;\n  font-size: 0.75rem;\n  font-weight: 600;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  color: var(--muted);\n  border-bottom: 1px solid var(--border);\n  background: var(--panel);\n}\n.pane-body {\n  flex: 1;\n  min-height: 0;\n  overflow: auto;\n  padding: 0;\n  background: var(--markup-bg);\n  color: var(--markup-fg);\n}\n.pane-body .placeholder {\n  margin: 1rem;\n}\n.placeholder {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 12rem;\n  color: var(--muted);\n  font-style: italic;\n  background: var(--placeholder-bg);\n  border: 1px dashed var(--border);\n  border-radius: 0.5rem;\n  padding: 2rem;\n  text-align: center;\n}\npre.markup {\n  margin: 0;\n  font-family: var(--font-mono);\n  font-size: 0.8125rem;\n  line-height: 1.5;\n  white-space: pre-wrap;\n  word-break: break-word;\n}\n.markup {\n  margin: 0;\n  padding: 0.75rem 1rem 1rem;\n  font-family: var(--font-mono);\n  font-size: 0.8125rem;\n  line-height: 1.55;\n  tab-size: 2;\n  --markup-indent: 2ch;\n  --markup-gutter-width: 1rem;\n}\n.markup-ghost-tag-part {\n  opacity: 0.35;\n  cursor: help;\n}\n.head-tooltip {\n  border-collapse: collapse;\n  width: 100%;\n  font-size: 0.6875rem;\n  line-height: 1.4;\n}\n.head-tooltip th {\n  padding: 0.1rem 0.55rem 0.1rem 0;\n  color: var(--muted);\n  font-weight: 600;\n  text-align: left;\n  vertical-align: top;\n  white-space: nowrap;\n}\n.head-tooltip td {\n  padding: 0.1rem 0;\n  vertical-align: top;\n  word-break: break-word;\n}\n.head-tooltip .head-default {\n  color: var(--muted);\n  font-style: italic;\n  white-space: nowrap;\n}\n.markup-el {\n  cursor: pointer;\n  border-radius: 0.2rem;\n}\n.markup-el:hover {\n  background: var(--markup-hover);\n}\n.markup-el.selected {\n  background: var(--markup-selected);\n  box-shadow: inset 0 0 0 1px var(--accent);\n}\n.markup-line {\n  white-space: pre-wrap;\n  word-break: break-word;\n  cursor: pointer;\n  padding: 0 0.25rem;\n  border-radius: 0.15rem;\n}\n.markup-line-content {\n  display: flex;\n  align-items: baseline;\n  min-width: 0;\n  padding-left: calc(var(--markup-depth, 0) * var(--markup-indent));\n}\n.markup-gutter {\n  flex: 0 0 var(--markup-gutter-width);\n  width: var(--markup-gutter-width);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.markup-line-body {\n  flex: 1 1 auto;\n  min-width: 0;\n}\n.markup-fold-toggle {\n  appearance: none;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: var(--markup-gutter-width);\n  height: 1rem;\n  margin: 0;\n  padding: 0;\n  border: none;\n  border-radius: 0.15rem;\n  background: transparent;\n  color: var(--muted);\n  cursor: pointer;\n  flex-shrink: 0;\n}\n.markup-fold-toggle::before {\n  content: '';\n  display: block;\n  width: 0;\n  height: 0;\n  border-top: 4px solid transparent;\n  border-bottom: 4px solid transparent;\n  border-left: 5px solid currentColor;\n  transform: rotate(90deg);\n  transition: transform 0.12s ease;\n}\n.markup-el-foldable.markup-collapsed > .markup-line-open .markup-fold-toggle::before {\n  transform: rotate(0deg);\n}\n.markup-fold-toggle:hover {\n  background: var(--markup-hover);\n  color: var(--markup-fg);\n}\n.markup-fold-suffix {\n  display: none;\n}\n.markup-el-foldable.markup-collapsed > .markup-line-open .markup-fold-suffix {\n  display: inline;\n}\n.markup-el-foldable.markup-collapsed > .markup-fold-body {\n  display: none;\n}\n.xml-tag {\n  color: var(--xml-tag);\n}\n.xml-bracket {\n  color: var(--xml-bracket);\n}\n.xml-attr-name {\n  color: var(--xml-attr-name);\n}\n.xml-attr-value {\n  color: var(--xml-attr-value);\n}\n.xml-attr-value-truncatable {\n  display: inline;\n}\n.xml-attr-value-chip {\n  appearance: none;\n  display: inline-flex;\n  align-items: center;\n  gap: 0.3em;\n  margin: 0 0 0 0.35em;\n  padding: 0.08em 0.45em 0.08em 0.5em;\n  border: 1px solid var(--border);\n  border-radius: 0.25rem;\n  background: var(--placeholder-bg);\n  color: var(--muted);\n  font-family: var(--font-ui, system-ui, sans-serif);\n  font-size: 0.72em;\n  font-weight: 600;\n  line-height: 1.35;\n  cursor: pointer;\n  vertical-align: baseline;\n  white-space: nowrap;\n}\n.xml-attr-value-chip::after {\n  content: '';\n  width: 0;\n  height: 0;\n  border-top: 0.28em solid currentColor;\n  border-left: 0.22em solid transparent;\n  border-right: 0.22em solid transparent;\n  opacity: 0.75;\n  transition: transform 0.12s ease;\n}\n.xml-attr-value-chip[aria-expanded='true']::after {\n  transform: rotate(180deg);\n}\n.xml-attr-value-chip:hover,\n.xml-attr-value-chip[aria-expanded='true'] {\n  border-color: var(--accent);\n  color: var(--accent);\n  background: color-mix(in srgb, var(--accent) 8%, var(--placeholder-bg));\n}\n.markup-embedded-uri-panel {\n  cursor: text;\n}\n.markup-embedded-uri-panel:hover {\n  background: transparent;\n}\n.markup-embedded-uri-panel-body {\n  margin: 0.1rem 0 0.25rem;\n  padding: 0.45rem 0.6rem;\n  max-height: 8rem;\n  overflow: auto;\n  color: var(--xml-attr-value);\n  word-break: break-all;\n  background: var(--placeholder-bg);\n  border: 1px solid var(--border);\n  border-radius: 0.25rem;\n  user-select: text;\n}\n.xml-text {\n  color: var(--xml-text);\n}\n.xml-cdata {\n  color: var(--xml-cdata);\n}\n.xml-cdata-delimiter {\n  color: var(--xml-cdata-delimiter);\n}\n";
	//#endregion
	//#region src/components/markup-pane/markup-pane.ts
	/** <doclang-markup-pane> — DocLang XML markup view */
	init_document();
	init_dom();
	var VIRTUAL_TEXT_TAG_HINT = "DocLang virtual <text>; wrapping tags not included in source";
	var LONG_EMBEDDED_URI_PREVIEW_LENGTH = 30;
	function isTruncatableEmbeddedImageUri(value) {
		if (!value || value.length <= LONG_EMBEDDED_URI_PREVIEW_LENGTH) return false;
		return /^(data:image\/|blob:)/i.test(value);
	}
	function formatCompactByteSize(bytes) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1048576) {
			const kb = bytes / 1024;
			return kb < 10 ? `${kb.toFixed(1)} KB` : `${Math.round(kb)} KB`;
		}
		return `${(bytes / 1048576).toFixed(1)} MB`;
	}
	function formatEmbeddedUriSizeLabel(value) {
		if (/^blob:/i.test(value)) return value.length >= 1024 ? `${Math.round(value.length / 1024)} KB URL` : `${value.length} char URL`;
		const comma = value.indexOf(",");
		if (comma === -1) return "embedded data";
		const header = value.slice(0, comma);
		const payload = value.slice(comma + 1).replace(/\s/g, "");
		const mime = /^data:([^;,]+)/i.exec(header)?.[1] ?? "";
		return `${mime.startsWith("image/") ? mime.slice(6) : mime || "data"} · ${formatCompactByteSize(Math.floor(payload.replace(/=+$/, "").length * 3 / 4))}`;
	}
	function createEmbeddedUriContinuationPanel(value, depth) {
		const { line, content } = createMarkupLineRow(depth);
		line.className = "markup-line markup-embedded-uri-panel";
		const body = document.createElement("div");
		body.className = "markup-embedded-uri-panel-body";
		body.textContent = value;
		body.addEventListener("click", (e) => e.stopPropagation());
		content.appendChild(body);
		return line;
	}
	function createTruncatableMarkupAttrValue(value) {
		const wrapper = document.createElement("span");
		wrapper.className = "xml-attr-value xml-attr-value-truncatable";
		wrapper.dataset.fullValue = value;
		const text = document.createElement("span");
		text.className = "xml-attr-value-text";
		text.textContent = value.slice(0, LONG_EMBEDDED_URI_PREVIEW_LENGTH);
		const toggle = document.createElement("button");
		toggle.type = "button";
		toggle.className = "xml-attr-value-chip";
		const sizeLabel = formatEmbeddedUriSizeLabel(value);
		toggle.dataset.collapsedLabel = sizeLabel;
		toggle.setAttribute("aria-expanded", "false");
		toggle.setAttribute("aria-label", `Show full value (${sizeLabel})`);
		const label = document.createElement("span");
		label.className = "xml-attr-value-chip-label";
		label.textContent = sizeLabel;
		toggle.appendChild(label);
		wrapper.append(text, toggle);
		return wrapper;
	}
	function toggleTruncatableMarkupAttrValue(toggle) {
		const wrapper = toggle.closest(".xml-attr-value-truncatable");
		if (!wrapper) return;
		const markupLine = wrapper.closest(".markup-line");
		const fullValue = wrapper.dataset.fullValue ?? "";
		const label = toggle.querySelector(".xml-attr-value-chip-label");
		const collapsedLabel = toggle.dataset.collapsedLabel ?? label?.textContent ?? "";
		if (toggle.getAttribute("aria-expanded") === "true") {
			toggle.setAttribute("aria-expanded", "false");
			toggle.setAttribute("aria-label", `Show full value (${collapsedLabel})`);
			if (label) label.textContent = collapsedLabel;
			if (markupLine?.nextElementSibling?.classList.contains("markup-embedded-uri-panel")) markupLine.nextElementSibling.remove();
			return;
		}
		toggle.setAttribute("aria-expanded", "true");
		toggle.setAttribute("aria-label", "Hide full value");
		if (label) label.textContent = "hide";
		if (!markupLine || markupLine.nextElementSibling?.classList.contains("markup-embedded-uri-panel")) return;
		const depth = Number(markupLine.style.getPropertyValue("--markup-depth") || 0);
		markupLine.insertAdjacentElement("afterend", createEmbeddedUriContinuationPanel(fullValue, depth));
	}
	function xmlSpan(className, text, { ghost = false } = {}) {
		const span = document.createElement("span");
		span.className = ghost ? `${className} markup-ghost-tag-part` : className;
		span.textContent = text;
		return span;
	}
	function createMarkupLine() {
		const line = document.createElement("div");
		line.className = "markup-line";
		return line;
	}
	function createMarkupFoldToggle() {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "markup-fold-toggle";
		btn.setAttribute("aria-expanded", "true");
		btn.setAttribute("aria-label", "Collapse");
		return btn;
	}
	function createMarkupLineRow(depth, { foldToggle = false } = {}) {
		const line = createMarkupLine();
		line.style.setProperty("--markup-depth", String(depth));
		const row = document.createElement("span");
		row.className = "markup-line-content";
		const gutter = document.createElement("span");
		gutter.className = "markup-gutter";
		gutter.setAttribute("aria-hidden", "true");
		if (foldToggle) gutter.appendChild(createMarkupFoldToggle());
		row.appendChild(gutter);
		const body = document.createElement("span");
		body.className = "markup-line-body";
		row.appendChild(body);
		line.appendChild(row);
		return {
			line,
			content: body
		};
	}
	function appendMarkupAttrValue(line, value) {
		if (isTruncatableEmbeddedImageUri(value)) line.appendChild(createTruncatableMarkupAttrValue(value));
		else line.appendChild(xmlSpan("xml-attr-value", value));
	}
	function appendMarkupAttributes(line, attributes) {
		for (const { name, value } of attributes) {
			line.appendChild(document.createTextNode(" "));
			line.appendChild(xmlSpan("xml-attr-name", name));
			line.appendChild(xmlSpan("xml-bracket", "=\""));
			appendMarkupAttrValue(line, value);
			line.appendChild(xmlSpan("xml-bracket", "\""));
		}
	}
	function appendMarkupTextContent(line, text) {
		const cdataMatch = /^<!\[CDATA\[([\s\S]*)\]\]>$/.exec(text);
		if (cdataMatch) {
			line.appendChild(xmlSpan("xml-cdata-delimiter", "<![CDATA["));
			line.appendChild(xmlSpan("xml-cdata", cdataMatch[1] ?? ""));
			line.appendChild(xmlSpan("xml-cdata-delimiter", "]]>"));
			return;
		}
		line.appendChild(xmlSpan("xml-text", text));
	}
	function appendOpenTagContent(line, tag, attributes, ghost = false) {
		line.appendChild(xmlSpan("xml-bracket", "<", { ghost }));
		line.appendChild(xmlSpan("xml-tag", tag, { ghost }));
		appendMarkupAttributes(line, attributes);
		line.appendChild(xmlSpan("xml-bracket", ">", { ghost }));
	}
	function appendMarkupFoldableOpen(parent, depth, tag, attributes, tagHint) {
		const ghost = Boolean(tagHint);
		const { line, content } = createMarkupLineRow(depth, { foldToggle: true });
		line.classList.add("markup-line-open");
		appendOpenTagContent(content, tag, attributes, ghost);
		const suffix = document.createElement("span");
		suffix.className = "markup-fold-suffix";
		suffix.appendChild(xmlSpan("xml-bracket", "...", { ghost }));
		suffix.appendChild(xmlSpan("xml-bracket", "</", { ghost }));
		suffix.appendChild(xmlSpan("xml-tag", tag, { ghost }));
		suffix.appendChild(xmlSpan("xml-bracket", ">", { ghost }));
		content.appendChild(suffix);
		parent.appendChild(line);
	}
	function appendMarkupCloseTag(parent, depth, tag, tagHint) {
		const ghost = Boolean(tagHint);
		const { line, content } = createMarkupLineRow(depth);
		content.appendChild(xmlSpan("xml-bracket", "</", { ghost }));
		content.appendChild(xmlSpan("xml-tag", tag, { ghost }));
		content.appendChild(xmlSpan("xml-bracket", ">", { ghost }));
		parent.appendChild(line);
	}
	function appendMarkupSelfClosingTag(parent, depth, tag, attributes) {
		const { line, content } = createMarkupLineRow(depth);
		content.appendChild(xmlSpan("xml-bracket", "<"));
		content.appendChild(xmlSpan("xml-tag", tag));
		appendMarkupAttributes(content, attributes);
		content.appendChild(xmlSpan("xml-bracket", "/>"));
		parent.appendChild(line);
	}
	function appendMarkupInlineElement(parent, depth, tag, attributes, text) {
		const { line, content } = createMarkupLineRow(depth);
		appendOpenTagContent(content, tag, attributes);
		appendMarkupTextContent(content, text);
		content.appendChild(xmlSpan("xml-bracket", "</"));
		content.appendChild(xmlSpan("xml-tag", tag));
		content.appendChild(xmlSpan("xml-bracket", ">"));
		parent.appendChild(line);
	}
	function appendMarkupTextLine(parent, depth, text) {
		const { line, content } = createMarkupLineRow(depth);
		appendMarkupTextContent(content, text);
		parent.appendChild(line);
	}
	function sliceHasMarkupContent$1(nodes) {
		for (let i = 0; i < nodes.length; i += 1) {
			const node = nodes[i];
			if (!node) continue;
			if (isTextLikeNode(node) && !isWhitespaceOnlyText(node)) return true;
			if (node.nodeType === Node.ELEMENT_NODE) return true;
		}
		return false;
	}
	function isVirtualTextSkippableNode$1(node) {
		if (isWhitespaceOnlyText(node)) return true;
		if (node.nodeType !== Node.ELEMENT_NODE) return false;
		const tag = localName(node);
		return tag === "location" || HEAD_TAGS.has(tag);
	}
	function shouldWrapVirtualText$1(contentNodes) {
		if (!sliceHasMarkupContent$1(contentNodes)) return false;
		for (const node of contentNodes) {
			if (isVirtualTextSkippableNode$1(node)) continue;
			if (isTextLikeNode(node)) return true;
			if (node.nodeType === Node.ELEMENT_NODE && !isSemanticElement(node)) return true;
		}
		return false;
	}
	function appendMarkupNodesFromSlice(parent, depth, nodes, elementIds) {
		for (let i = 0; i < nodes.length; i += 1) {
			const child = nodes[i];
			if (!child) continue;
			if (isTextLikeNode(child)) {
				const text = formatMarkupTextNode(child);
				if (text) appendMarkupTextLine(parent, depth, text);
			} else if (child.nodeType === Node.ELEMENT_NODE) parent.appendChild(buildMarkupElement(child, depth, elementIds));
		}
	}
	function appendMarkupVirtualText(parent, depth, hostEl, contentNodes, elementIds) {
		if (!shouldWrapVirtualText$1(contentNodes)) {
			appendMarkupNodesFromSlice(parent, depth, contentNodes, elementIds);
			return;
		}
		const block = document.createElement("div");
		block.className = "markup-el markup-el-virtual-text";
		const elementId = elementIds.get(hostEl);
		if (elementId) block.setAttribute("data-element-id", elementId);
		appendMarkupFoldableOpen(block, depth, "text", [], VIRTUAL_TEXT_TAG_HINT);
		block.classList.add("markup-el-foldable");
		const foldBody = document.createElement("div");
		foldBody.className = "markup-fold-body";
		const children = document.createElement("div");
		children.className = "markup-children";
		appendMarkupNodesFromSlice(children, depth + 1, contentNodes, elementIds);
		foldBody.appendChild(children);
		appendMarkupCloseTag(foldBody, depth, "text", VIRTUAL_TEXT_TAG_HINT);
		block.appendChild(foldBody);
		parent.appendChild(block);
	}
	function buildMarkupFoldableElement(el, depth, elementIds, buildBody) {
		const tag = localName(el);
		const block = document.createElement("div");
		block.className = "markup-el";
		const elementId = elementIds.get(el);
		if (elementId) block.setAttribute("data-element-id", elementId);
		appendMarkupFoldableOpen(block, depth, tag, markupAttributes(el));
		block.classList.add("markup-el-foldable");
		const foldBody = document.createElement("div");
		foldBody.className = "markup-fold-body";
		const children = document.createElement("div");
		children.className = "markup-children";
		buildBody(children, depth + 1);
		foldBody.appendChild(children);
		appendMarkupCloseTag(foldBody, depth, tag);
		block.appendChild(foldBody);
		return block;
	}
	function buildMarkupList(el, depth, elementIds) {
		return buildMarkupFoldableElement(el, depth, elementIds, (children, childDepth) => {
			const nodes = [...el.childNodes];
			let i = 0;
			while (i < nodes.length) {
				const node = nodes[i];
				if (!node) {
					i += 1;
					continue;
				}
				if (node.nodeType === Node.ELEMENT_NODE && localName(node) === "ldiv") break;
				if (isTextLikeNode(node) && isWhitespaceOnlyText(node)) {
					i += 1;
					continue;
				}
				if (isTextLikeNode(node)) break;
				if (node.nodeType === Node.ELEMENT_NODE) {
					const tag = localName(node);
					if (HEAD_TAGS.has(tag) || tag === "location") {
						children.appendChild(buildMarkupElement(node, childDepth, elementIds));
						i += 1;
						continue;
					}
				}
				break;
			}
			while (i < nodes.length) {
				const node = nodes[i];
				if (!node) {
					i += 1;
					continue;
				}
				if (node.nodeType !== Node.ELEMENT_NODE || localName(node) !== "ldiv") {
					appendMarkupNodesFromSlice(children, childDepth, [node], elementIds);
					i += 1;
					continue;
				}
				const ldiv = node;
				children.appendChild(buildMarkupElement(ldiv, childDepth, elementIds));
				i += 1;
				const end = skipUntilListItemBoundary(nodes, i);
				appendMarkupVirtualText(children, childDepth, ldiv, nodes.slice(i, end), elementIds);
				i = end;
			}
		});
	}
	function buildMarkupOtslContainer(el, depth, elementIds) {
		return buildMarkupFoldableElement(el, depth, elementIds, (children, childDepth) => {
			const nodes = [...el.childNodes];
			let i = 0;
			while (i < nodes.length) {
				const node = nodes[i];
				if (!node) {
					i += 1;
					continue;
				}
				if (node.nodeType === Node.ELEMENT_NODE && isCellToken(localName(node))) break;
				if (isTextLikeNode(node) && isWhitespaceOnlyText(node)) {
					i += 1;
					continue;
				}
				if (isTextLikeNode(node)) break;
				if (node.nodeType === Node.ELEMENT_NODE) {
					const tag = localName(node);
					if (HEAD_TAGS.has(tag) || tag === "location" || tag === "h_thread") {
						children.appendChild(buildMarkupElement(node, childDepth, elementIds));
						i += 1;
						continue;
					}
				}
				break;
			}
			while (i < nodes.length) {
				const node = nodes[i];
				if (!node) {
					i += 1;
					continue;
				}
				if (node.nodeType !== Node.ELEMENT_NODE) {
					appendMarkupNodesFromSlice(children, childDepth, [node], elementIds);
					i += 1;
					continue;
				}
				const tag = localName(node);
				if (tag === "nl") {
					appendMarkupSelfClosingTag(children, childDepth, "nl", []);
					i += 1;
					continue;
				}
				if (!isCellToken(tag)) {
					appendMarkupNodesFromSlice(children, childDepth, [node], elementIds);
					i += 1;
					continue;
				}
				const cell = node;
				children.appendChild(buildMarkupElement(cell, childDepth, elementIds));
				i += 1;
				if (CELL_SPAN_TAGS.has(tag)) continue;
				const end = skipUntilCellBoundary(nodes, i);
				appendMarkupVirtualText(children, childDepth, cell, nodes.slice(i, end), elementIds);
				i = end;
			}
		});
	}
	function buildMarkupElement(el, depth, elementIds) {
		const tag = localName(el);
		if (tag === "list") return buildMarkupList(el, depth, elementIds);
		if (OTSL_CONTAINER_TAGS.has(tag)) return buildMarkupOtslContainer(el, depth, elementIds);
		const block = document.createElement("div");
		block.className = "markup-el";
		const elementId = elementIds.get(el);
		if (elementId) block.setAttribute("data-element-id", elementId);
		const attributes = markupAttributes(el);
		if (!el.childNodes.length) {
			appendMarkupSelfClosingTag(block, depth, tag, attributes);
			return block;
		}
		const meaningfulText = [...el.childNodes].filter((n) => isTextLikeNode(n) && !isWhitespaceOnlyText(n));
		if (meaningfulText.length > 0 && meaningfulText.every(isTextLikeNode) && !childElements(el).length) {
			const text = serializeMarkupTextNodes(el.childNodes);
			if (text) {
				appendMarkupInlineElement(block, depth, tag, attributes, text);
				return block;
			}
		}
		appendMarkupFoldableOpen(block, depth, tag, attributes);
		block.classList.add("markup-el-foldable");
		const foldBody = document.createElement("div");
		foldBody.className = "markup-fold-body";
		const children = document.createElement("div");
		children.className = "markup-children";
		for (const child of el.childNodes) if (isTextLikeNode(child)) {
			const text = formatMarkupTextNode(child);
			if (text) appendMarkupTextLine(children, depth + 1, text);
		} else if (child.nodeType === Node.ELEMENT_NODE) children.appendChild(buildMarkupElement(child, depth + 1, elementIds));
		foldBody.appendChild(children);
		appendMarkupCloseTag(foldBody, depth, tag);
		block.appendChild(foldBody);
		return block;
	}
	var DoclangMarkupPane = class DoclangMarkupPane extends DoclangPageElement {
		static styles = r$6(markup_pane_default);
		_hasMarkup = null;
		_pendingContent = null;
		connectedCallback() {
			super.connectedCallback();
			this.classList.add("pane", "pane-markup");
			this.addEventListener("mousemove", this._onMousemove);
			this.addEventListener("mouseleave", this._onMouseleave);
		}
		disconnectedCallback() {
			super.disconnectedCallback();
			this.removeEventListener("mousemove", this._onMousemove);
			this.removeEventListener("mouseleave", this._onMouseleave);
		}
		render() {
			return b`
      <div class="pane-header">DocLang</div>
      <div class="pane-body" id="markup-pane" @click=${this._onBodyClick}>
        ${this._hasMarkup === false ? b`<div class="placeholder">${NO_MARKUP}</div>` : this._hasMarkup === true ? b`<div ${n$1(this._onContentRef)}></div>` : A}
      </div>
    `;
		}
		_onContentRef = (el) => {
			if (el && this._pendingContent) el.replaceChildren(this._pendingContent);
		};
		updated() {
			if (!this._pendingContent) return;
			const wrapper = this.shadowRoot?.querySelector(".pane-body > div");
			if (wrapper && !wrapper.contains(this._pendingContent)) wrapper.replaceChildren(this._pendingContent);
		}
		/** The scrollable content body inside the shadow root. */
		get scrollPane() {
			return this.shadowRoot?.querySelector(".pane-body") ?? null;
		}
		setVisible(visible) {
			this.hidden = !visible;
		}
		_applySelection() {
			if (!this.shadowRoot) return;
			for (const el of this.shadowRoot.querySelectorAll(".markup-el.selected")) el.classList.remove("selected");
			if (!this._selectedId) return;
			const target = this.shadowRoot.querySelector(`.markup-el-virtual-text[data-element-id="${this._selectedId}"]`) ?? this.shadowRoot.querySelector(`[data-element-id="${this._selectedId}"]`);
			if (target) {
				target.classList.add("selected");
				target.scrollIntoView({
					block: "nearest",
					behavior: "smooth"
				});
			}
		}
		_renderDocument() {
			const state = this._docState;
			if (!state) {
				this._pendingContent = null;
				this._hasMarkup = null;
				return;
			}
			const segment = state.segments[this._currentPage - 1] ?? [];
			const elementIds = assignElementIds(segment);
			state.elementIds = elementIds;
			state.idToElement = invertElementIds(elementIds);
			if (segmentHasMarkup(segment)) {
				this._pendingContent = this._buildMarkupView(segment, elementIds);
				this._hasMarkup = true;
			} else {
				this._pendingContent = null;
				this._hasMarkup = false;
			}
			this.requestUpdate();
		}
		_clearDocument() {
			this._pendingContent = null;
			this._hasMarkup = null;
			this.requestUpdate();
		}
		_buildMarkupView(segment, elementIds) {
			const root = document.createElement("div");
			root.className = "markup";
			for (const el of segment) if (el.nodeType === Node.ELEMENT_NODE) root.appendChild(buildMarkupElement(el, 0, elementIds));
			return root;
		}
		_onBodyClick = (e) => {
			const target = e.target;
			const attrToggle = target.closest(".xml-attr-value-chip");
			if (attrToggle) {
				e.stopPropagation();
				toggleTruncatableMarkupAttrValue(attrToggle);
				return;
			}
			const toggle = target.closest(".markup-fold-toggle");
			if (toggle) {
				e.stopPropagation();
				const block = toggle.closest(".markup-el-foldable");
				if (block) {
					const collapsed = block.classList.toggle("markup-collapsed");
					toggle.setAttribute("aria-expanded", String(!collapsed));
					toggle.setAttribute("aria-label", collapsed ? "Expand" : "Collapse");
				}
				return;
			}
			const ghostText = target.closest(".markup-el-virtual-text");
			const elementId = ghostText?.hasAttribute("data-element-id") ? ghostText.getAttribute("data-element-id") : target.closest(".markup-el[data-element-id]")?.getAttribute("data-element-id") ?? null;
			if (elementId) this.dispatchEvent(new CustomEvent("doclang-element-select", {
				bubbles: true,
				composed: true,
				detail: { id: elementId }
			}));
		};
		_onMousemove = (e) => {
			if (!e.target.closest(".markup-ghost-tag-part")) {
				this._hideHint();
				return;
			}
			this.dispatchEvent(new CustomEvent("doclang-hint", {
				bubbles: true,
				composed: true,
				detail: {
					text: VIRTUAL_TEXT_TAG_HINT,
					clientX: e.clientX,
					clientY: e.clientY
				}
			}));
		};
		_onMouseleave = () => this._hideHint();
		_hideHint() {
			this.dispatchEvent(new CustomEvent("doclang-hint-hide", {
				bubbles: true,
				composed: true
			}));
		}
	};
	__decorate([r$2()], DoclangMarkupPane.prototype, "_hasMarkup", void 0);
	DoclangMarkupPane = __decorate([t$2("doclang-markup-pane")], DoclangMarkupPane);
	//#endregion
	//#region src/components/page-view-pane/page-view-pane.css?inline
	var page_view_pane_default = ":host {\n  display: flex;\n  flex-direction: column;\n  border-right: 1px solid var(--border);\n  min-height: 0;\n  min-width: 0;\n}\n:host([hidden]) {\n  display: none !important;\n}\n:host(.pane-layout-last) {\n  border-right: none;\n}\n.pane-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.5rem;\n  box-sizing: border-box;\n  height: 2.125rem;\n  padding: 0 0.75rem;\n  font-size: 0.75rem;\n  font-weight: 600;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  color: var(--muted);\n  border-bottom: 1px solid var(--border);\n  background: var(--panel);\n}\n.pane-header-title {\n  min-width: 0;\n}\n.pane-page-controls {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  flex-shrink: 0;\n}\n.page-zoom-control {\n  display: flex;\n  align-items: center;\n  gap: 0.35rem;\n  user-select: none;\n}\n.page-zoom-control-label {\n  font-size: 0.625rem;\n  font-weight: 600;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  color: var(--muted);\n  cursor: pointer;\n}\n.page-zoom-control input[type='range'] {\n  width: 5.5rem;\n  height: 1rem;\n  margin: 0;\n  cursor: pointer;\n}\n.page-zoom-reset {\n  appearance: none;\n  border: 1px solid var(--border);\n  background: var(--bg);\n  color: var(--muted);\n  border-radius: 0.375rem;\n  padding: 0 0.45rem;\n  height: 1.25rem;\n  font: inherit;\n  font-size: 0.6875rem;\n  font-weight: 600;\n  font-variant-numeric: tabular-nums;\n  line-height: 1;\n  cursor: pointer;\n  min-width: 2.75rem;\n}\n.page-zoom-reset:not(:disabled):hover {\n  border-color: var(--accent);\n  color: var(--text);\n}\n.page-zoom-reset:disabled {\n  opacity: 0.55;\n  cursor: default;\n}\n.pane-settings-toggle {\n  appearance: none;\n  border: 1px solid transparent;\n  background: transparent;\n  color: var(--muted);\n  font-weight: 500;\n  cursor: pointer;\n  white-space: nowrap;\n  flex-shrink: 0;\n  display: inline-flex;\n  align-items: center;\n  transition:\n    color 0.12s ease,\n    background 0.12s ease,\n    border-color 0.12s ease;\n  border-radius: 0.25rem;\n  padding: 0 0.28rem 0 0.4rem;\n  height: 1.25rem;\n  font-size: 0.625rem;\n  font-weight: 600;\n  line-height: 1;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  font: inherit;\n}\n.pane-settings-toggle::after {\n  content: '';\n  flex-shrink: 0;\n  width: 0.26rem;\n  height: 0.26rem;\n  margin-left: 0.22rem;\n  margin-top: -0.1em;\n  border-right: 1.5px solid currentColor;\n  border-bottom: 1.5px solid currentColor;\n  transform: rotate(45deg);\n  opacity: 0.65;\n}\n.pane-settings-toggle:hover {\n  color: var(--text);\n  background: color-mix(in srgb, var(--text) 5%, transparent);\n}\n.pane-settings-toggle[aria-expanded='true'] {\n  color: var(--accent);\n  background: color-mix(in srgb, var(--accent) 10%, var(--panel));\n  border-color: color-mix(in srgb, var(--accent) 22%, transparent);\n}\n.pane-settings-toggle:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: 2px;\n}\n.pane-page-layout {\n  position: relative;\n  flex: 1;\n  min-height: 0;\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n}\n.pane-body {\n  flex: 1 1 auto;\n  min-width: 0;\n  min-height: 0;\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n  padding: 0.75rem;\n}\n.viewer-settings-layer {\n  position: absolute;\n  inset: 0;\n  z-index: 5;\n}\n.viewer-settings-layer[hidden] {\n  display: none;\n}\n.viewer-settings-scrim {\n  position: absolute;\n  inset: 0;\n  z-index: 0;\n  appearance: none;\n  border: none;\n  margin: 0;\n  padding: 0;\n  background: color-mix(in srgb, var(--bg) 28%, transparent);\n  cursor: default;\n}\n.viewer-settings {\n  position: absolute;\n  top: 0.5rem;\n  right: 0.5rem;\n  z-index: 1;\n  width: 13rem;\n  max-height: calc(100% - 1rem);\n  display: flex;\n  flex-direction: column;\n  min-height: 0;\n  border: 1px solid var(--border);\n  border-radius: 0.5rem;\n  background: var(--panel);\n  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.14);\n  overflow: hidden;\n}\n.viewer-settings-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.5rem;\n  padding: 0.5rem 0.75rem;\n  border-bottom: 1px solid var(--border);\n}\n.viewer-settings-title {\n  margin: 0;\n  font-size: 0.6875rem;\n  font-weight: 600;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  color: var(--muted);\n}\n.viewer-settings-close {\n  appearance: none;\n  border: none;\n  background: transparent;\n  color: var(--muted);\n  width: 1.5rem;\n  height: 1.5rem;\n  border-radius: 0.25rem;\n  font-size: 1.1rem;\n  line-height: 1;\n  cursor: pointer;\n}\n.viewer-settings-close:hover {\n  color: var(--text);\n  background: var(--bg);\n}\n.viewer-settings-body {\n  padding: 0.75rem;\n  overflow: auto;\n}\n.settings-option {\n  display: flex;\n  align-items: flex-start;\n  gap: 0.5rem;\n  font-size: 0.875rem;\n  cursor: pointer;\n  user-select: none;\n}\n.settings-option-primary + .settings-subgroup {\n  margin-top: 0.65rem;\n}\n.settings-option-primary {\n  font-weight: 600;\n}\n.settings-subgroup {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n  padding-left: 0.85rem;\n}\n.settings-reading-order-group {\n  gap: 0.35rem;\n  padding-left: 1.6rem;\n}\n.settings-option-nested {\n  padding-left: 0;\n}\n.settings-option-sub {\n  font-size: 0.8125rem;\n  color: var(--muted);\n}\n.settings-option-disabled {\n  opacity: 0.45;\n  cursor: not-allowed;\n}\n.settings-option-disabled input {\n  cursor: not-allowed;\n}\n.settings-option input {\n  margin: 0.15rem 0 0;\n  flex-shrink: 0;\n  cursor: pointer;\n}\n.page-view-port {\n  display: flex;\n  overflow: auto;\n  flex: 1 1 auto;\n  width: 100%;\n  height: 100%;\n  min-width: 0;\n  min-height: 0;\n  scrollbar-gutter: stable;\n}\n.pane-body.can-pan {\n  cursor: grab;\n}\n.pane-body.is-panning {\n  cursor: grabbing;\n  user-select: none;\n}\n.pane-body:focus {\n  outline: none;\n}\n.pane-body:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: -2px;\n}\n.placeholder {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 12rem;\n  color: var(--muted);\n  font-style: italic;\n  background: var(--placeholder-bg);\n  border: 1px dashed var(--border);\n  border-radius: 0.5rem;\n  padding: 2rem;\n  text-align: center;\n}\n.page-view {\n  position: relative;\n  display: block;\n  width: fit-content;\n  flex-shrink: 0;\n  margin: auto;\n  line-height: 0;\n  border: 1px solid var(--border);\n  border-radius: 0.25rem;\n  overflow: hidden;\n}\n.page-view img {\n  display: block;\n  width: auto;\n  height: auto;\n  max-width: none;\n  max-height: none;\n  border: none;\n  border-radius: 0;\n}\n.page-view img:not([data-layout-ready]) {\n  opacity: 0;\n}\n.page-view svg.overlay {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  pointer-events: auto;\n  overflow: hidden;\n}\n.overlay rect.bbox.bbox-hidden,\n.overlay .overlay-badge.bbox-hidden {\n  display: none;\n}\n.overlay rect.bbox {\n  stroke-width: 2;\n  vector-effect: non-scaling-stroke;\n  pointer-events: none;\n}\n.overlay rect.bbox.selected {\n  fill: color-mix(\n    in srgb,\n    var(--kind-stroke, var(--accent)) 30%,\n    transparent\n  ) !important;\n  stroke-width: 3.5;\n  filter: drop-shadow(\n    0 0 3px color-mix(in srgb, var(--kind-stroke, var(--accent)) 60%, transparent)\n  );\n}\n.overlay rect.bbox.related:not(.selected) {\n  fill: color-mix(\n    in srgb,\n    var(--kind-stroke, var(--accent)) 30%,\n    transparent\n  ) !important;\n}\n.overlay rect.bbox.layer-furniture,\n.overlay rect.bbox.layer-background {\n  fill: url(#layer-hatch) !important;\n  stroke: color-mix(in srgb, var(--kind-stroke, var(--muted)) 50%, transparent);\n}\n.overlay .layer-hatch-stripe {\n  fill: var(--muted);\n  fill-opacity: 0.06;\n}\n.overlay rect.bbox.layer-furniture.selected,\n.overlay rect.bbox.layer-background.selected {\n  fill: color-mix(\n    in srgb,\n    var(--kind-stroke, var(--accent)) 22%,\n    transparent\n  ) !important;\n}\n.overlay rect.bbox.layer-furniture.related:not(.selected),\n.overlay rect.bbox.layer-background.related:not(.selected) {\n  fill: color-mix(\n    in srgb,\n    var(--kind-stroke, var(--accent)) 18%,\n    transparent\n  ) !important;\n}\n.overlay .bbox-text {\n  fill: color-mix(in srgb, var(--kind-text) 14%, transparent);\n  stroke: var(--kind-text);\n}\n.overlay .bbox-heading {\n  fill: color-mix(in srgb, var(--kind-heading) 14%, transparent);\n  stroke: var(--kind-heading);\n}\n.overlay .bbox-list,\n.overlay .bbox-ldiv {\n  fill: color-mix(in srgb, var(--kind-list) 14%, transparent);\n  stroke: var(--kind-list);\n}\n.overlay .bbox-table {\n  fill: color-mix(in srgb, var(--kind-table) 14%, transparent);\n  stroke: var(--kind-table);\n}\n.overlay .bbox-index {\n  fill: color-mix(in srgb, var(--kind-index) 14%, transparent);\n  stroke: var(--kind-index);\n}\n.overlay .bbox-formula {\n  fill: color-mix(in srgb, var(--kind-formula) 14%, transparent);\n  stroke: var(--kind-formula);\n}\n.overlay .bbox-code {\n  fill: color-mix(in srgb, var(--kind-code) 16%, transparent);\n  stroke: var(--kind-code);\n}\n.overlay .bbox-picture {\n  fill: color-mix(in srgb, var(--kind-picture) 14%, transparent);\n  stroke: var(--kind-picture);\n}\n.overlay .bbox-group {\n  fill: color-mix(in srgb, var(--kind-group) 14%, transparent);\n  stroke: var(--kind-group);\n}\n.overlay .bbox-footnote {\n  fill: color-mix(in srgb, var(--kind-footnote) 14%, transparent);\n  stroke: var(--kind-footnote);\n}\n.overlay .bbox-page_header,\n.overlay .bbox-page_footer {\n  fill: color-mix(in srgb, var(--kind-page_header) 14%, transparent);\n  stroke: var(--kind-page_header);\n}\n.overlay .bbox-caption {\n  fill: color-mix(in srgb, var(--kind-caption) 14%, transparent);\n  stroke: var(--kind-caption);\n}\n.overlay line.caption-link {\n  color: var(--kind-caption);\n  stroke: currentColor;\n  stroke-width: 1.5;\n  vector-effect: non-scaling-stroke;\n  pointer-events: none;\n  fill: none;\n}\n.overlay line.caption-link.bbox-hidden {\n  display: none;\n}\n.overlay line.xref-link {\n  color: var(--kind-footnote);\n  stroke: currentColor;\n  stroke-width: 1.5;\n  vector-effect: non-scaling-stroke;\n  pointer-events: none;\n  fill: none;\n}\n.overlay line.xref-link.bbox-hidden {\n  display: none;\n}\n.overlay .fragment-link {\n  pointer-events: none;\n}\n.overlay .fragment-link.bbox-hidden {\n  display: none;\n}\n.overlay .fragment-link-path {\n  color: var(--overlay-fragment);\n  fill: none;\n  stroke: currentColor;\n  stroke-width: 1.5;\n  vector-effect: non-scaling-stroke;\n}\n.overlay .fragment-link-path-dashed {\n  stroke-dasharray: 6 4;\n}\n.overlay .fragment-nav {\n  pointer-events: none;\n}\n.overlay .fragment-nav.bbox-hidden {\n  display: none;\n}\n.overlay .fragment-nav-btn {\n  pointer-events: auto;\n  cursor: pointer;\n}\n.overlay .fragment-nav-btn-disabled {\n  pointer-events: none;\n  cursor: default;\n  opacity: 0.35;\n}\n.overlay .fragment-nav-btn-bg {\n  fill: var(--panel);\n  stroke: var(--overlay-fragment);\n  stroke-width: 1;\n  vector-effect: non-scaling-stroke;\n}\n.overlay .fragment-nav-btn-label {\n  fill: var(--overlay-fragment);\n  font-family: var(--font-ui);\n  font-weight: 700;\n  text-anchor: middle;\n  dominant-baseline: central;\n  pointer-events: none;\n}\n.overlay .fragment-nav-btn:not(.fragment-nav-btn-disabled):hover .fragment-nav-btn-bg {\n  fill: color-mix(in srgb, var(--overlay-fragment) 12%, var(--panel));\n}\n.overlay .fragment-link-label {\n  fill: var(--overlay-fragment);\n  font-family: var(--font-ui);\n  font-weight: 600;\n  font-style: italic;\n  text-anchor: middle;\n  dominant-baseline: middle;\n  paint-order: stroke fill;\n  stroke: var(--panel);\n  stroke-width: 3px;\n}\n.overlay .reading-order-step {\n  color: var(--overlay-reading-order);\n  stroke: currentColor;\n  stroke-width: 1.5;\n  stroke-dasharray: 5 4;\n  vector-effect: non-scaling-stroke;\n  pointer-events: none;\n  fill: none;\n}\n.overlay .reading-order-step.bbox-hidden,\n.overlay .reading-order-badge.bbox-hidden {\n  display: none;\n}\n.overlay .overlay-badge {\n  pointer-events: none;\n}\n.overlay .overlay-badge-bg {\n  fill-opacity: 1;\n  stroke: none;\n}\n.reading-order-badge .overlay-badge-bg {\n  fill: var(--overlay-reading-order);\n}\n.overlay .element-badge {\n  opacity: 0.8;\n  pointer-events: auto;\n  cursor: help;\n}\n.overlay .element-badge .overlay-badge-bg {\n  fill: var(--accent);\n}\n.overlay .element-badge.kind-text .overlay-badge-bg { fill: var(--kind-text); }\n.overlay .element-badge.kind-heading .overlay-badge-bg { fill: var(--kind-heading); }\n.overlay .element-badge.kind-list .overlay-badge-bg { fill: var(--kind-list); }\n.overlay .element-badge.kind-table .overlay-badge-bg { fill: var(--kind-table); }\n.overlay .element-badge.kind-index .overlay-badge-bg { fill: var(--kind-index); }\n.overlay .element-badge.kind-formula .overlay-badge-bg { fill: var(--kind-formula); }\n.overlay .element-badge.kind-code .overlay-badge-bg { fill: var(--kind-code); }\n.overlay .element-badge.kind-picture .overlay-badge-bg { fill: var(--kind-picture); }\n.overlay .element-badge.kind-group .overlay-badge-bg { fill: var(--kind-group); }\n.overlay .element-badge.kind-footnote .overlay-badge-bg { fill: var(--kind-footnote); }\n.overlay .element-badge.kind-page_header .overlay-badge-bg { fill: var(--kind-page_header); }\n.overlay .element-badge.kind-caption .overlay-badge-bg { fill: var(--kind-caption); }\n.overlay .element-badge.kind-field .overlay-badge-bg { fill: var(--kind-field); }\n.overlay .overlay-badge-label {\n  fill: #ffffff;\n  fill-opacity: 1;\n  font-family: var(--font-ui);\n  font-weight: 700;\n  text-anchor: middle;\n  dominant-baseline: central;\n  pointer-events: none;\n}\n.overlay .bbox-field {\n  fill: color-mix(in srgb, var(--kind-field) 14%, transparent);\n  stroke: var(--kind-field);\n}\n.overlay .bbox-default {\n  fill: color-mix(in srgb, var(--kind-default) 12%, transparent);\n  stroke: var(--kind-default);\n}\n@media (prefers-color-scheme: dark) {\n  .overlay .bbox-text {\n    fill: color-mix(in srgb, var(--kind-text) 20%, transparent);\n  }\n  .overlay .bbox-heading {\n    fill: color-mix(in srgb, var(--kind-heading) 20%, transparent);\n  }\n  .overlay .bbox-list,\n  .overlay .bbox-ldiv {\n    fill: color-mix(in srgb, var(--kind-list) 20%, transparent);\n  }\n  .overlay .bbox-table {\n    fill: color-mix(in srgb, var(--kind-table) 18%, transparent);\n  }\n  .overlay .bbox-index {\n    fill: color-mix(in srgb, var(--kind-index) 18%, transparent);\n  }\n  .overlay .bbox-formula {\n    fill: color-mix(in srgb, var(--kind-formula) 18%, transparent);\n  }\n  .overlay .bbox-code {\n    fill: color-mix(in srgb, var(--kind-code) 20%, transparent);\n  }\n  .overlay .bbox-picture {\n    fill: color-mix(in srgb, var(--kind-picture) 20%, transparent);\n  }\n  .overlay .bbox-group {\n    fill: color-mix(in srgb, var(--kind-group) 20%, transparent);\n  }\n  .overlay .bbox-footnote {\n    fill: color-mix(in srgb, var(--kind-footnote) 18%, transparent);\n  }\n  .overlay .bbox-page_header,\n  .overlay .bbox-page_footer {\n    fill: color-mix(in srgb, var(--kind-page_header) 18%, transparent);\n  }\n  .overlay .bbox-caption {\n    fill: color-mix(in srgb, var(--kind-caption) 18%, transparent);\n  }\n  .overlay .bbox-field {\n    fill: color-mix(in srgb, var(--kind-field) 18%, transparent);\n  }\n  .overlay .bbox-default {\n    fill: color-mix(in srgb, var(--kind-default) 18%, transparent);\n  }\n}\n";
	//#endregion
	//#region src/components/page-view-pane/overlay.ts
	init_dom();
	var OVERLAY_BADGE_FONT_SIZE = 16.5 * .8;
	var OVERLAY_BADGE_PAD_X = 3;
	var OVERLAY_BADGE_PAD_Y = 2;
	var OVERLAY_BADGE_RADIUS_SCREEN_PX = 3;
	/** Demo page size; overlay lengths are calibrated to match pre-fix sizing on these images. */
	var OVERLAY_REF_IMAGE_WIDTH = 1224;
	var OVERLAY_REF_IMAGE_HEIGHT = 1584;
	var FRAGMENT_NAV_HINT_PREV = "Previous fragment";
	var FRAGMENT_NAV_HINT_NEXT = "Next fragment";
	var FRAGMENT_LINK_LABEL_CROSS_PAGE = "cross-page content";
	var FRAGMENT_LINK_LABEL_SAME_PAGE = "fragmented content";
	function elementKindKey(kind) {
		if (kind.startsWith("field_") || kind === "key" || kind === "value" || kind === "hint") return "field";
		if (kind === "tabular") return "table";
		return (/* @__PURE__ */ new Set([
			"text",
			"heading",
			"list",
			"ldiv",
			"table",
			"index",
			"formula",
			"code",
			"picture",
			"group",
			"footnote",
			"page_header",
			"page_footer",
			"caption"
		])).has(kind) ? kind : "default";
	}
	function kindClassForTag(tag) {
		return `kind-${elementKindKey(tag)}`;
	}
	function bboxClassForKind(kind) {
		return elementKindKey(kind);
	}
	function pageZoomFactor(ctx) {
		return ctx.zoomPct / 100;
	}
	function paneContentSize(pane) {
		const style = getComputedStyle(pane);
		const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
		const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
		return {
			w: pane.clientWidth - padX,
			h: pane.clientHeight - padY
		};
	}
	function getCachedFitScale(img, pane, ctx) {
		const { w: paneW, h: paneH } = paneContentSize(pane);
		const imgW = img.naturalWidth;
		const imgH = img.naturalHeight;
		const cache = ctx.layoutCache;
		if (cache && cache.paneW === paneW && cache.paneH === paneH && cache.imgW === imgW && cache.imgH === imgH) return cache.fitScale;
		const fitScale = paneW > 0 && paneH > 0 && imgW > 0 && imgH > 0 ? Math.min((paneW - 2) / imgW, (paneH - 2) / imgH) : 1;
		ctx.setLayoutCache({
			paneW,
			paneH,
			imgW,
			imgH,
			fitScale
		});
		return fitScale;
	}
	function overlayUserLength(baseUserPx, ctx, img) {
		const resolvedImg = img ?? ctx.pane.querySelector(".page-view img");
		const zoom = pageZoomFactor(ctx);
		if (!(zoom > 0)) return baseUserPx;
		const { pane } = ctx;
		if (!resolvedImg?.naturalWidth || !resolvedImg.naturalHeight) return baseUserPx / zoom;
		const { w: paneW, h: paneH } = paneContentSize(pane);
		if (!(paneW > 0 && paneH > 0)) return baseUserPx / zoom;
		const refFit = Math.min((paneW - 2) / OVERLAY_REF_IMAGE_WIDTH, (paneH - 2) / OVERLAY_REF_IMAGE_HEIGHT);
		const fitScale = getCachedFitScale(resolvedImg, pane, ctx);
		if (!(refFit > 0) || !(fitScale > 0)) return baseUserPx / zoom;
		return baseUserPx * refFit / (fitScale * zoom);
	}
	function applyPageImageSize(img, pane, ctx) {
		if (!img?.naturalWidth || !img.naturalHeight) return false;
		const zoomPct = Math.max(100, ctx.zoomPct);
		const scale = getCachedFitScale(img, pane, ctx) * (zoomPct / 100);
		const w = Math.floor(img.naturalWidth * scale);
		const h = Math.floor(img.naturalHeight * scale);
		const nextW = `${w}px`;
		const nextH = `${h}px`;
		const unchanged = img.style.width === nextW && img.style.height === nextH;
		if (!unchanged) {
			img.style.width = nextW;
			img.style.height = nextH;
			img.style.maxWidth = "none";
			img.style.maxHeight = "none";
		}
		img.dataset.layoutReady = "1";
		return !unchanged;
	}
	function boxPixelRect(b, img) {
		const x = b.x0 / b.resW * img.naturalWidth;
		const y = b.y0 / b.resH * img.naturalHeight;
		const w = (b.x1 - b.x0) / b.resW * img.naturalWidth;
		const h = (b.y1 - b.y0) / b.resH * img.naturalHeight;
		return {
			x,
			y,
			w,
			h,
			area: w * h
		};
	}
	function boxCenter(rect) {
		return {
			x: rect.x + rect.w / 2,
			y: rect.y + rect.h / 2
		};
	}
	function overlayBoxPaintPriority(box) {
		if (box.kind === "text") return 0;
		if (box.kind === "list" || box.kind === "table" || box.kind === "index" || box.kind === "tabular") return 2;
		return 1;
	}
	function overlayLayerPriority(layer) {
		if (layer === "background") return 0;
		if (layer === "furniture") return 1;
		return 2;
	}
	function compareOverlayBoxPaintOrder(a, b, selectedId) {
		const byLayer = overlayLayerPriority(a.layer ?? "body") - overlayLayerPriority(b.layer ?? "body");
		if (byLayer !== 0) return byLayer;
		const byPriority = overlayBoxPaintPriority(a) - overlayBoxPaintPriority(b);
		if (byPriority !== 0) return byPriority;
		if (selectedId) {
			const aSelected = a.elementId === selectedId;
			if (aSelected !== (b.elementId === selectedId)) return aSelected ? 1 : -1;
		}
		return 0;
	}
	function sortedOverlayBoxes(boxes, selectedId) {
		return [...boxes].sort((a, b) => compareOverlayBoxPaintOrder(a, b, selectedId));
	}
	function ensureArrowMarker(defs, markerId) {
		if (defs.querySelector(`#${markerId}`)) return;
		const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
		marker.setAttribute("id", markerId);
		marker.setAttribute("viewBox", "0 0 6 6");
		marker.setAttribute("refX", "6");
		marker.setAttribute("refY", "3");
		marker.setAttribute("markerWidth", "5");
		marker.setAttribute("markerHeight", "5");
		marker.setAttribute("orient", "auto");
		const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
		arrowPath.setAttribute("d", "M0,0 L6,3 L0,6 Z");
		arrowPath.setAttribute("fill", "currentColor");
		marker.appendChild(arrowPath);
		defs.appendChild(marker);
	}
	function alignDashedLineToEnd(line, start, end) {
		const dash = 6;
		const gap = 4;
		const period = 10;
		const len = Math.hypot(end.x - start.x, end.y - start.y);
		if (!len) return;
		line.setAttribute("stroke-dasharray", `${dash} ${gap}`);
		const offset = len % period;
		if (offset > .01) line.setAttribute("stroke-dashoffset", String(offset));
	}
	function ensureLayerHatchPatterns(defs) {
		if (defs.querySelector("#layer-hatch")) return;
		const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
		pattern.setAttribute("id", "layer-hatch");
		pattern.setAttribute("width", "16");
		pattern.setAttribute("height", "16");
		pattern.setAttribute("patternUnits", "userSpaceOnUse");
		pattern.setAttribute("patternTransform", "rotate(45 8 8)");
		const stripe = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		stripe.setAttribute("class", "layer-hatch-stripe");
		stripe.setAttribute("x", "10");
		stripe.setAttribute("y", "-4");
		stripe.setAttribute("width", "6");
		stripe.setAttribute("height", "24");
		pattern.appendChild(stripe);
		defs.appendChild(pattern);
	}
	function ensureOverlayDefs(svg) {
		let defs = svg.querySelector("defs");
		if (!defs) {
			defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
			svg.insertBefore(defs, svg.firstChild);
		}
		return defs;
	}
	function overlayBadgeLayout(svg, text, fontSizeUser, ctx) {
		const padXUser = overlayUserLength(OVERLAY_BADGE_PAD_X, ctx);
		const padYUser = overlayUserLength(OVERLAY_BADGE_PAD_Y, ctx);
		const probe = document.createElementNS("http://www.w3.org/2000/svg", "text");
		probe.setAttribute("class", "overlay-badge-label");
		probe.setAttribute("font-size", String(fontSizeUser));
		probe.setAttribute("font-weight", "700");
		probe.setAttribute("text-anchor", "start");
		probe.setAttribute("dominant-baseline", "text-before-edge");
		probe.setAttribute("visibility", "hidden");
		probe.textContent = String(text);
		svg.appendChild(probe);
		let width;
		let height;
		try {
			const bbox = probe.getBBox();
			width = bbox.width + padXUser * 2;
			height = bbox.height + padYUser * 2;
		} catch {
			width = overlayUserLength(String(text).length * OVERLAY_BADGE_FONT_SIZE * .55 + 6, ctx);
			height = overlayUserLength(18.520000000000003, ctx);
		}
		probe.remove();
		return {
			width,
			height
		};
	}
	function appendOverlayBadge(svg, anchorX, anchorY, text, { extraClass, elementId }, ctx) {
		const fontSize = overlayUserLength(OVERLAY_BADGE_FONT_SIZE, ctx);
		const { width, height } = overlayBadgeLayout(svg, text, fontSize, ctx);
		const radius = overlayUserLength(OVERLAY_BADGE_RADIUS_SCREEN_PX, ctx);
		const badge = document.createElementNS("http://www.w3.org/2000/svg", "g");
		badge.setAttribute("class", `overlay-badge ${extraClass}`);
		badge.setAttribute("data-element-id", elementId);
		const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		bg.setAttribute("class", "overlay-badge-bg");
		bg.setAttribute("x", String(anchorX - width / 2));
		bg.setAttribute("y", String(anchorY - height / 2));
		bg.setAttribute("width", String(width));
		bg.setAttribute("height", String(height));
		bg.setAttribute("rx", String(radius));
		bg.setAttribute("ry", String(radius));
		badge.appendChild(bg);
		const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
		label.setAttribute("class", "overlay-badge-label");
		label.setAttribute("x", String(anchorX));
		label.setAttribute("y", String(anchorY));
		label.setAttribute("font-size", String(fontSize));
		label.textContent = String(text);
		badge.appendChild(label);
		svg.appendChild(badge);
		return badge;
	}
	function syncOverlayBadges(img, svg, boxes, readingOrderSteps, showAllBboxes, showLayoutBadges, showReadingOrder, ctx) {
		if (!img.naturalWidth) return;
		svg.querySelectorAll(".element-badge, .reading-order-badge").forEach((b) => b.remove());
		const fontSize = overlayUserLength(OVERLAY_BADGE_FONT_SIZE, ctx);
		const badgeGap = overlayUserLength(2, ctx);
		const readingOrderByElementId = /* @__PURE__ */ new Map();
		if (showAllBboxes && showReadingOrder) for (const step of readingOrderSteps) readingOrderByElementId.set(step.elementId, step);
		const sorted = sortedOverlayBoxes(boxes, ctx.selectedId);
		for (const b of sorted) {
			const { x, y } = boxPixelRect(b, img);
			let tagLayout = { width: 0 };
			if (showAllBboxes && showLayoutBadges) {
				tagLayout = overlayBadgeLayout(svg, b.tag, fontSize, ctx);
				appendOverlayBadge(svg, x, y, b.tag, {
					extraClass: `element-badge ${kindClassForTag(b.kind)}`,
					elementId: b.elementId
				}, ctx);
			}
			const step = readingOrderByElementId.get(b.elementId);
			if (step) {
				const orderText = String(step.order);
				const orderLayout = overlayBadgeLayout(svg, orderText, fontSize, ctx);
				appendOverlayBadge(svg, showAllBboxes && showLayoutBadges ? x + tagLayout.width / 2 + badgeGap + orderLayout.width / 2 : x, y, orderText, {
					extraClass: "reading-order-badge",
					elementId: b.elementId
				}, ctx);
			}
		}
	}
	function appendOverlayLinks(svg, img, links, { markerId, linkClass, fromIdAttr, toIdAttr }) {
		if (!links.length) return;
		ensureArrowMarker(ensureOverlayDefs(svg), markerId);
		for (const link of links) {
			const fromBox = link.captionBox ?? link.fromBox;
			const toBox = link.hostBox ?? link.toBox;
			const from = boxPixelRect(fromBox, img);
			const to = boxPixelRect(toBox, img);
			const start = boxCenter(from);
			const end = boxCenter(to);
			const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
			line.setAttribute("class", linkClass);
			line.setAttribute("x1", String(start.x));
			line.setAttribute("y1", String(start.y));
			line.setAttribute("x2", String(end.x));
			line.setAttribute("y2", String(end.y));
			line.setAttribute("marker-end", `url(#${markerId})`);
			const fromId = link.captionElementId ?? link.fromElementId;
			const toId = link.hostElementId ?? link.toElementId;
			line.setAttribute(fromIdAttr, fromId);
			line.setAttribute(toIdAttr, toId);
			svg.appendChild(line);
		}
	}
	function appendCaptionLinks(svg, img, captionLinks) {
		appendOverlayLinks(svg, img, captionLinks, {
			markerId: "caption-arrowhead",
			linkClass: "caption-link",
			fromIdAttr: "data-caption-id",
			toIdAttr: "data-host-id"
		});
	}
	function appendXrefLinks(svg, img, xrefLinks) {
		appendOverlayLinks(svg, img, xrefLinks, {
			markerId: "xref-arrowhead",
			linkClass: "xref-link",
			fromIdAttr: "data-xref-from-id",
			toIdAttr: "data-xref-to-id"
		});
	}
	function docPointToPixel(xDoc, yDoc, resW, resH, img) {
		return {
			x: xDoc / resW * img.naturalWidth,
			y: yDoc / resH * img.naturalHeight
		};
	}
	function pageCornerTarget(img, defaultResolution, corner, ctx) {
		const { width: resW, height: resH } = defaultResolution;
		const inset = overlayUserLength(5, ctx);
		const tl = docPointToPixel(0, 0, resW, resH, img);
		const br = docPointToPixel(resW, resH, resW, resH, img);
		if (corner === "tl") return {
			x: Math.min(tl.x + inset, br.x - inset),
			y: Math.min(tl.y + inset, br.y - inset)
		};
		return {
			x: Math.max(br.x - inset, tl.x + inset),
			y: Math.max(br.y - inset, tl.y + inset)
		};
	}
	function appendFragmentLinks(svg, img, links, defaultResolution, ctx) {
		if (!links.length) return;
		ensureArrowMarker(ensureOverlayDefs(svg), "fragment-arrowhead");
		const fontSize = overlayUserLength(OVERLAY_BADGE_FONT_SIZE, ctx);
		for (const link of links) {
			const fromRect = boxPixelRect(link.fromBox, img);
			const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
			group.setAttribute("class", "fragment-link");
			group.setAttribute("data-thread-id", link.threadId);
			group.setAttribute("data-fragment-from-id", link.fromElementId);
			if (link.toElementId) group.setAttribute("data-fragment-to-id", link.toElementId);
			let labelAt;
			if (link.toBox) {
				const toRect = boxPixelRect(link.toBox, img);
				const start = boxCenter(fromRect);
				const end = boxCenter(toRect);
				const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
				line.setAttribute("class", "fragment-link-path fragment-link-path-dashed");
				line.setAttribute("x1", String(start.x));
				line.setAttribute("y1", String(start.y));
				line.setAttribute("x2", String(end.x));
				line.setAttribute("y2", String(end.y));
				line.setAttribute("marker-end", "url(#fragment-arrowhead)");
				alignDashedLineToEnd(line, start, end);
				group.appendChild(line);
				labelAt = {
					x: (start.x + end.x) / 2,
					y: (start.y + end.y) / 2
				};
			} else {
				const corner = link.targetCorner ?? "br";
				const cornerPoint = pageCornerTarget(img, defaultResolution, corner, ctx);
				const elementAnchor = boxCenter(fromRect);
				const incoming = corner === "tl";
				const start = incoming ? cornerPoint : elementAnchor;
				const end = incoming ? elementAnchor : cornerPoint;
				const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
				line.setAttribute("class", "fragment-link-path fragment-link-path-dashed");
				line.setAttribute("x1", String(start.x));
				line.setAttribute("y1", String(start.y));
				line.setAttribute("x2", String(end.x));
				line.setAttribute("y2", String(end.y));
				line.setAttribute("marker-end", "url(#fragment-arrowhead)");
				alignDashedLineToEnd(line, start, end);
				group.appendChild(line);
				labelAt = {
					x: (start.x + end.x) / 2,
					y: (start.y + end.y) / 2
				};
			}
			const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
			text.setAttribute("class", "fragment-link-label");
			text.setAttribute("x", String(labelAt.x));
			text.setAttribute("y", String(labelAt.y));
			text.setAttribute("font-size", String(fontSize));
			text.textContent = link.toBox ? FRAGMENT_LINK_LABEL_SAME_PAGE : FRAGMENT_LINK_LABEL_CROSS_PAGE;
			group.appendChild(text);
			svg.appendChild(group);
		}
	}
	function appendFragmentNavButtons(svg, img, items, ctx) {
		if (!items.length) return;
		const btnSize = overlayUserLength(19.5, ctx);
		const gap = overlayUserLength(2, ctx);
		const inset = overlayUserLength(3, ctx);
		const fontSize = overlayUserLength(15, ctx);
		const radius = overlayUserLength(3, ctx);
		for (const item of items) {
			const { x, y, w, h } = boxPixelRect(item.box, img);
			const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
			group.setAttribute("class", "fragment-nav");
			group.setAttribute("data-element-id", item.elementId);
			const rowY = y + h - inset - btnSize;
			const nextX = x + w - inset - btnSize;
			appendFragmentNavButton(group, nextX - gap - btnSize, rowY, btnSize, radius, fontSize, "prev", "‹", item.hasPrev);
			appendFragmentNavButton(group, nextX, rowY, btnSize, radius, fontSize, "next", "›", item.hasNext);
			svg.appendChild(group);
		}
	}
	function appendFragmentNavButton(group, x, y, size, radius, fontSize, direction, label, enabled) {
		const btn = document.createElementNS("http://www.w3.org/2000/svg", "g");
		btn.setAttribute("class", `fragment-nav-btn fragment-nav-btn-${direction}${enabled ? "" : " fragment-nav-btn-disabled"}`);
		btn.setAttribute("data-nav", direction);
		if (enabled) {
			btn.setAttribute("role", "button");
			btn.setAttribute("aria-label", direction === "prev" ? FRAGMENT_NAV_HINT_PREV : FRAGMENT_NAV_HINT_NEXT);
		}
		const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		bg.setAttribute("class", "fragment-nav-btn-bg");
		bg.setAttribute("x", String(x));
		bg.setAttribute("y", String(y));
		bg.setAttribute("width", String(size));
		bg.setAttribute("height", String(size));
		bg.setAttribute("rx", String(radius));
		bg.setAttribute("ry", String(radius));
		btn.appendChild(bg);
		const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
		text.setAttribute("class", "fragment-nav-btn-label");
		text.setAttribute("x", String(x + size / 2));
		text.setAttribute("y", String(y + size / 2));
		text.setAttribute("font-size", String(fontSize));
		text.textContent = label;
		btn.appendChild(text);
		group.appendChild(btn);
	}
	function appendReadingOrderOverlay(svg, img, steps) {
		if (!steps.length) return;
		if (steps.length >= 2) {
			ensureArrowMarker(ensureOverlayDefs(svg), "reading-order-arrowhead");
			for (let i = 0; i < steps.length - 1; i += 1) {
				const from = boxPixelRect(steps[i].box, img);
				const to = boxPixelRect(steps[i + 1].box, img);
				const start = boxCenter(from);
				const end = boxCenter(to);
				const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
				line.setAttribute("class", "reading-order-step");
				line.setAttribute("x1", String(start.x));
				line.setAttribute("y1", String(start.y));
				line.setAttribute("x2", String(end.x));
				line.setAttribute("y2", String(end.y));
				line.setAttribute("marker-end", "url(#reading-order-arrowhead)");
				svg.appendChild(line);
			}
		}
	}
	function buildOverlay(img, boxes, captionLinks = [], xrefLinks = [], readingOrderSteps = [], fragmentLinks = [], fragmentNavItems = [], defaultResolution = {
		width: 512,
		height: 512
	}, onSelectElement, onNavigateFragment, onClearSelection, getPagPanSuppressClick, setPagPanSuppressClick, ctx) {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.classList.add("overlay");
		svg.setAttribute("viewBox", `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
		svg.setAttribute("overflow", "hidden");
		appendCaptionLinks(svg, img, captionLinks);
		appendXrefLinks(svg, img, xrefLinks);
		appendFragmentLinks(svg, img, fragmentLinks, defaultResolution, ctx);
		appendReadingOrderOverlay(svg, img, readingOrderSteps);
		ensureLayerHatchPatterns(ensureOverlayDefs(svg));
		for (const b of sortedOverlayBoxes(boxes, ctx.selectedId)) {
			const { x, y, w, h } = boxPixelRect(b, img);
			const cls = bboxClassForKind(b.kind);
			const kindClass = kindClassForTag(b.kind);
			const layerClass = layerClassForValue(b.layer ?? "body");
			const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
			rect.setAttribute("class", `bbox bbox-${cls} ${kindClass}${layerClass ? ` ${layerClass}` : ""}`);
			rect.setAttribute("x", String(x));
			rect.setAttribute("y", String(y));
			rect.setAttribute("width", String(Math.max(w, 1)));
			rect.setAttribute("height", String(Math.max(h, 1)));
			rect.setAttribute("data-element-id", b.elementId);
			svg.appendChild(rect);
		}
		appendFragmentNavButtons(svg, img, fragmentNavItems, ctx);
		svg.addEventListener("click", (e) => {
			if (getPagPanSuppressClick()) {
				setPagPanSuppressClick(false);
				return;
			}
			const target = e.target;
			const navBtn = target.closest(".fragment-nav-btn:not(.fragment-nav-btn-disabled)");
			if (navBtn) {
				e.stopPropagation();
				const elementId = navBtn.closest(".fragment-nav")?.getAttribute("data-element-id");
				const direction = navBtn.getAttribute("data-nav");
				if (elementId && direction) onNavigateFragment(elementId, direction);
				return;
			}
			const badge = target.closest(".overlay-badge[data-element-id]");
			if (badge) {
				const id = badge.getAttribute("data-element-id");
				if (id) onSelectElement(id);
				return;
			}
			const coords = imageCoordsFromEvent(svg, e);
			if (!coords) return;
			const hit = hitTestBoxes(boxes, img, coords.x, coords.y);
			if (hit) onSelectElement(hit.elementId);
			else onClearSelection();
		});
		svg.addEventListener("mousemove", (e) => {
			const coords = imageCoordsFromEvent(svg, e);
			svg.style.cursor = coords && hitTestBoxes(boxes, img, coords.x, coords.y) ? "pointer" : "";
		});
		svg.addEventListener("mouseleave", () => {
			svg.style.cursor = "";
		});
		return svg;
	}
	function imageCoordsFromEvent(svg, evt) {
		const pt = svg.createSVGPoint();
		pt.x = evt.clientX;
		pt.y = evt.clientY;
		const ctm = svg.getScreenCTM()?.inverse();
		if (!ctm) return null;
		const p = pt.matrixTransform(ctm);
		return {
			x: p.x,
			y: p.y
		};
	}
	function hitTestBoxes(boxes, img, x, y) {
		let best = null;
		let bestArea = Infinity;
		for (const b of boxes) {
			const { x: bx, y: by, w, h, area } = boxPixelRect(b, img);
			if (x >= bx && x <= bx + w && y >= by && y <= by + h && area < bestArea) {
				best = b;
				bestArea = area;
			}
		}
		return best;
	}
	//#endregion
	//#region src/components/page-view-pane/page-view-pane.ts
	/** <doclang-page-view-pane> — page image with zoom and overlay settings panel */
	init_document();
	init_dom();
	var PAGE_PAN_DRAG_THRESHOLD = 5;
	var NO_IMAGE = "(No page image available.)";
	var DoclangPageViewPane = class DoclangPageViewPane extends DoclangPageElement {
		static styles = r$6(page_view_pane_default);
		_bodyRef = e();
		_settingsOpen = false;
		_visible = false;
		_zoomPct = 100;
		_opts = {
			showAllBboxes: true,
			showLayoutBadges: true,
			showReadingOrder: false,
			readingOrderArrows: true,
			readingOrderGlobal: false,
			showPictureContents: false,
			showTableContents: false,
			showFragmentLinks: false,
			showXrefLinks: false,
			showCaptionLinks: false
		};
		_panDrag = null;
		_suppressClick = false;
		_layoutCache = null;
		_layoutFrame = 0;
		_resizeObserver = null;
		connectedCallback() {
			super.connectedCallback();
			this.classList.add("pane", "pane-page-view");
			this.addEventListener("doclang-panning-change", this._onPanningChange);
			this.addEventListener("mousemove", this._onMousemove);
			this.addEventListener("mouseleave", this._onMouseleave);
		}
		disconnectedCallback() {
			super.disconnectedCallback();
			this.removeEventListener("doclang-panning-change", this._onPanningChange);
			this.removeEventListener("mousemove", this._onMousemove);
			this.removeEventListener("mouseleave", this._onMouseleave);
			this._resizeObserver?.disconnect();
			this._resizeObserver = null;
		}
		render() {
			const layoutEnabled = this._opts.showAllBboxes;
			const readingOrderEnabled = layoutEnabled && this._opts.showReadingOrder;
			return b`
      <div class="pane-header">
        <span class="pane-header-title">Original page</span>
        <div class="pane-page-controls">
          ${this._visible ? b`
                  <div class="page-zoom-control">
                    <label class="page-zoom-control-label">
                      <span aria-hidden="true">Zoom</span>
                      <input
                        type="range"
                        class="zoom-input"
                        min="100"
                        max="300"
                        step="10"
                        .value=${String(this._zoomPct)}
                        aria-valuemin="100"
                        aria-valuemax="300"
                        aria-valuenow=${this._zoomPct}
                        aria-label="Page zoom"
                        @input=${this._onZoomInput}
                      />
                    </label>
                    <button
                      type="button"
                      class="page-zoom-reset"
                      title="Reset zoom"
                      aria-label="Reset zoom"
                      ?disabled=${this._zoomPct === 100}
                      @click=${() => {
				if (this._zoomPct !== 100) this.resetZoom();
			}}
                    >
                      ${this._zoomPct}%
                    </button>
                  </div>
                  <button
                    type="button"
                    class="pane-settings-toggle"
                    aria-expanded=${this._settingsOpen ? "true" : "false"}
                    @click=${() => this.toggleSettings()}
                  >
                    Overlays
                  </button>
                ` : A}
        </div>
      </div>
      <div class="pane-page-layout">
        <div
          class="pane-body"
          id="page-pane"
          tabindex=${this._visible ? "0" : "-1"}
          ${n$1(this._bodyRef)}
        ></div>
        ${this._settingsOpen ? b`
                <div class="viewer-settings-layer">
                  <button
                    type="button"
                    class="viewer-settings-scrim"
                    tabindex="-1"
                    aria-label="Close overlays"
                    @click=${() => this._setSettingsOpen(false)}
                  ></button>
                  <aside
                    class="viewer-settings"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="page-settings-title"
                  >
                    <div class="viewer-settings-header">
                      <h2 class="viewer-settings-title" id="page-settings-title">
                        Overlays
                      </h2>
                      <button
                        type="button"
                        class="viewer-settings-close"
                        aria-label="Close overlays"
                        @click=${() => this._setSettingsOpen(false)}
                      >
                        ×
                      </button>
                    </div>
                    <div class="viewer-settings-body">
                      <label class="settings-option settings-option-primary">
                        <input
                          type="checkbox"
                          class="cb-all-bboxes"
                          .checked=${this._opts.showAllBboxes}
                          @change=${(e) => this._onOptChange("showAllBboxes", e.target.checked)}
                        />
                        <span>Layout</span>
                      </label>
                      <div class="settings-subgroup">
                        <label
                          class=${e$2({
				"settings-option": true,
				"settings-option-sub": true,
				"settings-option-disabled": !layoutEnabled
			})}
                        >
                          <input
                            type="checkbox"
                            class="cb-reading-order"
                            .checked=${this._opts.showReadingOrder}
                            ?disabled=${!layoutEnabled}
                            @change=${(e) => this._onOptChange("showReadingOrder", e.target.checked)}
                          />
                          <span>Reading order</span>
                        </label>
                        <div class="settings-subgroup settings-reading-order-group">
                          <label
                            class=${e$2({
				"settings-option": true,
				"settings-option-sub": true,
				"settings-option-nested": true,
				"settings-option-disabled": !readingOrderEnabled
			})}
                          >
                            <input
                              type="checkbox"
                              class="cb-reading-order-arrows"
                              .checked=${this._opts.readingOrderArrows}
                              ?disabled=${!readingOrderEnabled}
                              @change=${(e) => this._onOptChange("readingOrderArrows", e.target.checked)}
                            />
                            <span>Arrows</span>
                          </label>
                          <label
                            class=${e$2({
				"settings-option": true,
				"settings-option-sub": true,
				"settings-option-nested": true,
				"settings-option-disabled": !readingOrderEnabled
			})}
                          >
                            <input
                              type="checkbox"
                              class="cb-reading-order-global"
                              .checked=${this._opts.readingOrderGlobal}
                              ?disabled=${!readingOrderEnabled}
                              @change=${(e) => this._onOptChange("readingOrderGlobal", e.target.checked)}
                            />
                            <span>Global numbering</span>
                          </label>
                        </div>
                        <label
                          class=${e$2({
				"settings-option": true,
				"settings-option-sub": true,
				"settings-option-disabled": !layoutEnabled
			})}
                        >
                          <input
                            type="checkbox"
                            class="cb-picture-contents"
                            .checked=${this._opts.showPictureContents}
                            ?disabled=${!layoutEnabled}
                            @change=${(e) => this._onOptChange("showPictureContents", e.target.checked)}
                          />
                          <span>Picture contents</span>
                        </label>
                        <label
                          class=${e$2({
				"settings-option": true,
				"settings-option-sub": true,
				"settings-option-disabled": !layoutEnabled
			})}
                        >
                          <input
                            type="checkbox"
                            class="cb-table-contents"
                            .checked=${this._opts.showTableContents}
                            ?disabled=${!layoutEnabled}
                            @change=${(e) => this._onOptChange("showTableContents", e.target.checked)}
                          />
                          <span>Table contents</span>
                        </label>
                        <label
                          class=${e$2({
				"settings-option": true,
				"settings-option-sub": true,
				"settings-option-disabled": !layoutEnabled
			})}
                        >
                          <input
                            type="checkbox"
                            class="cb-fragment-links"
                            .checked=${this._opts.showFragmentLinks}
                            ?disabled=${!layoutEnabled}
                            @change=${(e) => this._onOptChange("showFragmentLinks", e.target.checked)}
                          />
                          <span>Fragments</span>
                        </label>
                        <label
                          class=${e$2({
				"settings-option": true,
				"settings-option-sub": true,
				"settings-option-disabled": !layoutEnabled
			})}
                        >
                          <input
                            type="checkbox"
                            class="cb-xref-links"
                            .checked=${this._opts.showXrefLinks}
                            ?disabled=${!layoutEnabled}
                            @change=${(e) => this._onOptChange("showXrefLinks", e.target.checked)}
                          />
                          <span>Cross-references</span>
                        </label>
                        <label
                          class=${e$2({
				"settings-option": true,
				"settings-option-sub": true,
				"settings-option-disabled": !layoutEnabled
			})}
                        >
                          <input
                            type="checkbox"
                            class="cb-caption-links"
                            .checked=${this._opts.showCaptionLinks}
                            ?disabled=${!layoutEnabled}
                            @change=${(e) => this._onOptChange("showCaptionLinks", e.target.checked)}
                          />
                          <span>Captions</span>
                        </label>
                        <label
                          class=${e$2({
				"settings-option": true,
				"settings-option-sub": true,
				"settings-option-disabled": !layoutEnabled
			})}
                        >
                          <input
                            type="checkbox"
                            class="cb-layout-badges"
                            .checked=${this._opts.showLayoutBadges}
                            ?disabled=${!layoutEnabled}
                            @change=${(e) => this._onOptChange("showLayoutBadges", e.target.checked)}
                          />
                          <span>Badges</span>
                        </label>
                      </div>
                    </div>
                  </aside>
                </div>
              ` : A}
      </div>
    `;
		}
		firstUpdated() {
			const body = this._bodyRef.value;
			if (body) this._wirePanEvents(body);
		}
		get zoomPercent() {
			return this._zoomPct;
		}
		get overlaySettings() {
			return this._opts;
		}
		get suppressClick() {
			return this._suppressClick;
		}
		setSuppressClick(v) {
			this._suppressClick = v;
		}
		/** The scrollable viewport pane (page-view-port div, or body if absent). */
		get scrollPane() {
			return this._scrollPane();
		}
		setVisible(visible) {
			this._visible = visible;
			this.hidden = !visible;
			this.requestUpdate();
		}
		/**
		* Recalculate image size and re-sync overlay badge positions.
		* Also ensures the ResizeObserver is attached (idempotent).
		*/
		refreshLayout() {
			const body = this._bodyRef.value;
			if (!body) return;
			if (!this._resizeObserver) {
				this._resizeObserver = new ResizeObserver(() => this.refreshLayout());
				this._resizeObserver.observe(body);
			}
			cancelAnimationFrame(this._layoutFrame);
			this._layoutFrame = requestAnimationFrame(() => {
				this._layoutFrame = 0;
				const img = body.querySelector(".page-view img");
				if (img?.naturalWidth) {
					applyPageImageSize(img, body, this._overlayCtx());
					this._updatePanCursor();
					this._syncOverlayBadgesForImg(img);
					this.dispatchEvent(new CustomEvent("doclang-layout-refresh", {
						bubbles: true,
						composed: true
					}));
				}
			});
		}
		activateZoom(pct) {
			this._zoomPct = pct;
			this._layoutCache = null;
			this.requestUpdate();
			this._resetScroll();
		}
		resetZoom() {
			this._zoomPct = 100;
			this._layoutCache = null;
			this.requestUpdate();
			this._resetScroll();
			this.dispatchEvent(new CustomEvent("doclang-zoom-change", {
				bubbles: true,
				composed: true,
				detail: { pct: this._zoomPct }
			}));
		}
		toggleSettings() {
			this._setSettingsOpen(!this._settingsOpen);
		}
		closeSettings() {
			if (this._settingsOpen) this._setSettingsOpen(false);
		}
		_applySelection() {
			const body = this._bodyRef.value;
			if (!body) return;
			for (const el of body.querySelectorAll(".bbox.selected, .overlay-badge.selected")) el.classList.remove("selected");
			if (this._selectedId && this._docState?.hasPageView) for (const el of body.querySelectorAll(`[data-element-id="${this._selectedId}"]`)) el.classList.add("selected");
			const img = body.querySelector(".page-view img");
			if (img) this._syncOverlayBadgesForImg(img);
			this._applyBboxVisibility();
		}
		_renderDocument() {
			const body = this._bodyRef.value;
			if (!body) {
				this.requestUpdate();
				this.updateComplete.then(() => this._renderDocument());
				return;
			}
			const state = this._docState;
			body.innerHTML = "";
			this._layoutCache = null;
			this._selectedId = null;
			this._peerIds = /* @__PURE__ */ new Set();
			if (!state?.hasPageView) return;
			const imageUrl = state.pageImages.get(this._currentPage);
			if (!imageUrl) {
				body.innerHTML = `<div class="placeholder">${NO_IMAGE}</div>`;
				return;
			}
			const port = document.createElement("div");
			port.className = "page-view-port";
			const wrap = document.createElement("div");
			wrap.className = "page-view";
			const img = document.createElement("img");
			img.alt = `Page ${this._currentPage}`;
			const pageNum = this._currentPage;
			const onImageReady = () => {
				if (img.dataset.layoutGeneration === String(pageNum)) return;
				img.dataset.layoutGeneration = String(pageNum);
				applyPageImageSize(img, body, this._overlayCtx());
				const segment = state.segments[pageNum - 1] ?? [];
				const elementIds = assignElementIds(segment);
				state.elementIds = elementIds;
				state.idToElement = invertElementIds(elementIds);
				const boxes = collectBoundingBoxes(segment, state.defaultResolution, elementIds);
				const existing = wrap.querySelector("svg.overlay");
				if (existing) existing.remove();
				const readingOrderSteps = collectReadingOrderSteps(segment, elementIds, boxes, state.readingOrder, this._opts.readingOrderGlobal, state.readingOrderDisplayNumbers);
				state.pageViewOverlay = {
					boxes,
					readingOrderSteps
				};
				if (boxes.length) wrap.appendChild(buildOverlay(img, boxes, collectCaptionLinks(segment, elementIds, boxes), collectXrefLinks(segment, elementIds, boxes), readingOrderSteps, collectFragmentLinks(segment, elementIds, boxes, pageNum, state.threadPagesById), collectFragmentNavItems(segment, elementIds, boxes, state.threadNavByElement), state.defaultResolution, (id) => this.dispatchEvent(new CustomEvent("doclang-element-select", {
					bubbles: true,
					composed: true,
					detail: { id }
				})), (elementId, direction) => this.dispatchEvent(new CustomEvent("doclang-navigate-thread", {
					bubbles: true,
					composed: true,
					detail: {
						elementId,
						direction
					}
				})), () => this.dispatchEvent(new CustomEvent("doclang-clear-selection", {
					bubbles: true,
					composed: true
				})), () => this._suppressClick, (v) => {
					this._suppressClick = v;
				}, this._overlayCtx()));
				this._syncOverlayBadgesForImg(img);
				this._applyBboxVisibility();
				const pending = state.pendingSelectElement;
				if (pending) {
					state.pendingSelectElement = null;
					const id = this._findElementIdOnPage(pending, elementIds);
					if (id) this.dispatchEvent(new CustomEvent("doclang-element-select", {
						bubbles: true,
						composed: true,
						detail: { id }
					}));
				}
			};
			img.addEventListener("load", onImageReady, { once: true });
			wrap.appendChild(img);
			port.appendChild(wrap);
			body.appendChild(port);
			img.src = imageUrl;
			if (img.complete) onImageReady();
			this.refreshLayout();
		}
		_clearDocument() {
			const body = this._bodyRef.value;
			if (body) body.innerHTML = "";
			this._layoutCache = null;
		}
		_overlayCtx() {
			const body = this._bodyRef.value;
			return {
				zoomPct: this._zoomPct,
				pane: body,
				layoutCache: this._layoutCache,
				setLayoutCache: (c) => {
					this._layoutCache = c;
				},
				selectedId: this._selectedId
			};
		}
		_syncOverlayBadgesForImg(img) {
			const svg = img.parentElement?.querySelector("svg.overlay");
			const overlay = this._docState?.pageViewOverlay;
			if (!svg || !overlay) return;
			const { showAllBboxes, showLayoutBadges, showReadingOrder } = this._opts;
			syncOverlayBadges(img, svg, overlay.boxes, overlay.readingOrderSteps, showAllBboxes, showLayoutBadges, showReadingOrder, this._overlayCtx());
		}
		_isContentsOptionHidden(elementId, clickVisible) {
			if (clickVisible) return false;
			const xmlEl = this._docState?.idToElement?.get(elementId) ?? null;
			if (!this._opts.showPictureContents && isPictureContentElement(xmlEl)) return true;
			if (!this._opts.showTableContents && isTableContentElement(xmlEl)) return true;
			return false;
		}
		_isFragmentLinkRelevant(linkEl) {
			const fromId = linkEl.getAttribute("data-fragment-from-id");
			const toId = linkEl.getAttribute("data-fragment-to-id");
			if (fromId && this._peerIds.has(fromId)) return true;
			if (toId && this._peerIds.has(toId)) return true;
			return false;
		}
		_applyBboxVisibility() {
			const body = this._bodyRef.value;
			if (!body || !this._docState?.hasPageView) return;
			const { showAllBboxes, showLayoutBadges, showCaptionLinks, showXrefLinks, showFragmentLinks, showReadingOrder, readingOrderArrows } = this._opts;
			const selectedId = this._selectedId;
			const peerIds = this._peerIds;
			for (const el of body.querySelectorAll(".bbox")) {
				el.classList.remove("related");
				const elementId = el.getAttribute("data-element-id") ?? "";
				const clickVisible = elementId === selectedId || peerIds.has(elementId);
				if (showAllBboxes) {
					if (this._isContentsOptionHidden(elementId, clickVisible)) el.classList.add("bbox-hidden");
					else {
						el.classList.remove("bbox-hidden");
						if (peerIds.has(elementId)) el.classList.add("related");
					}
					continue;
				}
				if (elementId === selectedId) el.classList.remove("bbox-hidden");
				else if (peerIds.has(elementId)) {
					el.classList.remove("bbox-hidden");
					el.classList.add("related");
				} else el.classList.add("bbox-hidden");
			}
			for (const el of body.querySelectorAll(".element-badge")) {
				const elementId = el.getAttribute("data-element-id") ?? "";
				const clickVisible = elementId === selectedId || peerIds.has(elementId);
				if (!showAllBboxes || !showLayoutBadges) {
					el.classList.add("bbox-hidden");
					continue;
				}
				if (this._isContentsOptionHidden(elementId, clickVisible)) el.classList.add("bbox-hidden");
				else el.classList.remove("bbox-hidden");
			}
			for (const el of body.querySelectorAll(".caption-link")) el.classList.toggle("bbox-hidden", !showAllBboxes || !showCaptionLinks);
			for (const el of body.querySelectorAll(".xref-link")) el.classList.toggle("bbox-hidden", !showAllBboxes || !showXrefLinks);
			for (const el of body.querySelectorAll(".fragment-link")) {
				const clickVisible = Boolean(selectedId && this._isFragmentLinkRelevant(el));
				el.classList.toggle("bbox-hidden", !(clickVisible || showAllBboxes && showFragmentLinks));
			}
			for (const el of body.querySelectorAll(".fragment-nav")) {
				const elementId = el.getAttribute("data-element-id") ?? "";
				const clickVisible = elementId === selectedId || peerIds.has(elementId);
				el.classList.toggle("bbox-hidden", !(clickVisible || showAllBboxes && showFragmentLinks));
			}
			for (const el of body.querySelectorAll(".reading-order-badge")) {
				const elementId = el.getAttribute("data-element-id") ?? "";
				const clickVisible = elementId === selectedId || peerIds.has(elementId);
				if (!showAllBboxes || !showReadingOrder) {
					el.classList.add("bbox-hidden");
					continue;
				}
				const xmlEl = this._docState?.idToElement?.get(elementId) ?? null;
				if (isPictureContentElement(xmlEl) || isTableContentElement(xmlEl) || this._isContentsOptionHidden(elementId, clickVisible)) {
					el.classList.add("bbox-hidden");
					continue;
				}
				el.classList.remove("bbox-hidden");
			}
			for (const el of body.querySelectorAll(".reading-order-step")) el.classList.toggle("bbox-hidden", !showAllBboxes || !showReadingOrder || !readingOrderArrows);
		}
		_findElementIdOnPage(el, elementIds) {
			return elementIds.get(el) ?? null;
		}
		_scrollPane() {
			const body = this._bodyRef.value;
			if (!body) return null;
			return body.querySelector(".page-view-port") ?? body;
		}
		_isScrollable() {
			const pane = this._scrollPane();
			if (!pane) return false;
			return pane.scrollWidth > pane.clientWidth || pane.scrollHeight > pane.clientHeight;
		}
		_resetScroll() {
			const port = this._scrollPane();
			if (port) {
				port.scrollLeft = 0;
				port.scrollTop = 0;
			}
		}
		_updatePanCursor() {
			const body = this._bodyRef.value;
			if (body) body.classList.toggle("can-pan", this._isScrollable() && !this._panDrag);
		}
		_setSettingsOpen(open) {
			this._settingsOpen = open;
			this.requestUpdate();
		}
		_onOptChange(key, value) {
			this._opts[key] = value;
			if (key === "readingOrderGlobal" && this._docState) this._renderDocument();
			const img = this._bodyRef.value?.querySelector(".page-view img");
			if (img) this._syncOverlayBadgesForImg(img);
			this._applyBboxVisibility();
			this._emitOverlayChange();
			this.requestUpdate();
		}
		_emitOverlayChange() {
			this.dispatchEvent(new CustomEvent("doclang-overlay-change", {
				bubbles: true,
				composed: true,
				detail: { ...this._opts }
			}));
		}
		_onZoomInput = (e) => {
			this._zoomPct = Math.max(100, Number(e.target.value));
			this._layoutCache = null;
			this.requestUpdate();
			this.dispatchEvent(new CustomEvent("doclang-zoom-change", {
				bubbles: true,
				composed: true,
				detail: { pct: this._zoomPct }
			}));
		};
		_wirePanEvents(body) {
			body.addEventListener("pointerdown", (e) => {
				if (e.button !== 0) return;
				if (!(e.target instanceof Element) || !e.target.closest(".page-view")) return;
				if (!this._isScrollable()) return;
				const scrollPane = this._scrollPane();
				if (!scrollPane) return;
				this._panDrag = {
					pointerId: e.pointerId,
					startX: e.clientX,
					startY: e.clientY,
					scrollLeft: scrollPane.scrollLeft,
					scrollTop: scrollPane.scrollTop,
					moved: false
				};
			});
			body.addEventListener("pointermove", (e) => {
				if (!this._panDrag || e.pointerId !== this._panDrag.pointerId) return;
				const dx = e.clientX - this._panDrag.startX;
				const dy = e.clientY - this._panDrag.startY;
				if (!this._panDrag.moved && Math.hypot(dx, dy) >= PAGE_PAN_DRAG_THRESHOLD) {
					this._panDrag.moved = true;
					body.classList.add("is-panning");
					body.classList.remove("can-pan");
					body.setPointerCapture(e.pointerId);
					this.dispatchEvent(new CustomEvent("doclang-panning-change", {
						bubbles: true,
						composed: true,
						detail: { panning: true }
					}));
				}
				if (!this._panDrag.moved) return;
				const scrollPane = this._scrollPane();
				if (!scrollPane) return;
				scrollPane.scrollLeft = this._panDrag.scrollLeft + this._panDrag.startX - e.clientX;
				scrollPane.scrollTop = this._panDrag.scrollTop + this._panDrag.startY - e.clientY;
				e.preventDefault();
			});
			const endPan = (e) => {
				if (!this._panDrag || e.pointerId !== this._panDrag.pointerId) return;
				const wasPanning = this._panDrag.moved;
				if (wasPanning) this._suppressClick = true;
				this._panDrag = null;
				body.classList.remove("is-panning");
				if (wasPanning) this.dispatchEvent(new CustomEvent("doclang-panning-change", {
					bubbles: true,
					composed: true,
					detail: { panning: false }
				}));
				if (body.hasPointerCapture(e.pointerId)) body.releasePointerCapture(e.pointerId);
				this._updatePanCursor();
			};
			body.addEventListener("pointerup", (e) => endPan(e));
			body.addEventListener("pointercancel", (e) => endPan(e));
			body.setAttribute("role", "region");
			body.setAttribute("aria-label", "Original page");
			body.addEventListener("pointerdown", () => {
				if (this._docState?.hasPageView) body.focus({ preventScroll: true });
			});
			body.addEventListener("keydown", (e) => {
				if (!this._docState?.hasPageView) return;
				let dir = 0;
				switch (e.key) {
					case "ArrowDown":
					case "PageDown":
					case "ArrowRight":
						dir = 1;
						break;
					case "ArrowUp":
					case "PageUp":
					case "ArrowLeft": dir = -1;
				}
				if (dir) {
					e.preventDefault();
					this.dispatchEvent(new CustomEvent("doclang-page-key-nav", {
						bubbles: true,
						composed: true,
						detail: { dir }
					}));
				}
			});
		}
		_onPanningChange = (e) => {
			if (e.detail.panning) this._hideHint();
		};
		_onMousemove = (e) => {
			if (this._panDrag?.moved) {
				this._hideHint();
				return;
			}
			const navBtn = e.target.closest(".fragment-nav-btn:not(.fragment-nav-btn-disabled)");
			if (navBtn) {
				const hint = navBtn.getAttribute("data-nav") === "prev" ? FRAGMENT_NAV_HINT_PREV : FRAGMENT_NAV_HINT_NEXT;
				this._showHint({
					text: hint,
					clientX: e.clientX,
					clientY: e.clientY
				});
				return;
			}
			const badge = e.target.closest(".element-badge[data-element-id]");
			if (!badge || !this._docState?.idToElement) {
				this._hideHint();
				return;
			}
			const elementId = badge.getAttribute("data-element-id");
			const xmlEl = elementId ? this._docState.idToElement.get(elementId) : null;
			if (!xmlEl) {
				this._hideHint();
				return;
			}
			this._showHint({
				html: this._elementHeadTooltipHtml(xmlEl, this._docState.defaultResolution),
				clientX: e.clientX,
				clientY: e.clientY
			});
		};
		_onMouseleave = () => this._hideHint();
		_showHint(detail) {
			this.dispatchEvent(new CustomEvent("doclang-hint", {
				bubbles: true,
				composed: true,
				detail
			}));
		}
		_hideHint() {
			this.dispatchEvent(new CustomEvent("doclang-hint-hide", {
				bubbles: true,
				composed: true
			}));
		}
		_elementHeadTooltipHtml(el, defaultResolution) {
			return `<table class="head-tooltip"><tbody>${this._collectElementHeadInfo(el, defaultResolution).map(({ key, value, isDefault }) => {
				const rendered = escapeHtml(value);
				const suffix = isDefault ? " <span class=\"head-default\">(default)</span>" : "";
				return `<tr><th scope="row">${escapeHtml(key)}</th><td>${rendered}${suffix}</td></tr>`;
			}).join("")}</tbody></table>`;
		}
		_collectElementHeadInfo(el, defaultResolution) {
			const labelEl = firstHeadChild(el, "label");
			const threadEl = firstHeadChild(el, "thread");
			const xrefEl = firstHeadChild(el, "xref");
			const hrefEl = firstHeadChild(el, "href");
			const layerEl = firstHeadChild(el, "layer");
			const captionEl = firstHeadChild(el, "caption");
			const descriptionEl = firstHeadChild(el, "description");
			const summaryEl = firstHeadChild(el, "summary");
			const customEl = firstHeadChild(el, "custom");
			const locs = elementHeadLocations(el);
			const rows = [{
				key: "element",
				value: elementLabel(el),
				isDefault: false
			}];
			rows.push({
				key: "label",
				value: labelEl?.getAttribute("value") ?? "undefined",
				isDefault: !labelEl?.hasAttribute("value")
			});
			if (threadEl) rows.push({
				key: "thread_id",
				value: threadEl.getAttribute("thread_id") ?? "—",
				isDefault: false
			});
			else rows.push({
				key: "thread",
				value: "—",
				isDefault: true
			});
			if (xrefEl) rows.push({
				key: "xref",
				value: `thread_id ${xrefEl.getAttribute("thread_id") ?? "—"}`,
				isDefault: false
			});
			else rows.push({
				key: "xref",
				value: "—",
				isDefault: true
			});
			if (hrefEl) rows.push({
				key: "href",
				value: hrefEl.getAttribute("uri") ?? "—",
				isDefault: false
			});
			else rows.push({
				key: "href",
				value: "—",
				isDefault: true
			});
			rows.push({
				key: "layer",
				value: layerEl?.getAttribute("value") ?? "body",
				isDefault: !layerEl?.hasAttribute("value")
			});
			const cornerLabels = [
				"x_min",
				"y_min",
				"x_max",
				"y_max"
			];
			if (locs.length === 4) for (let idx = 0; idx < 4; idx += 1) {
				const loc = locs[idx];
				const resolution = locationResolution(loc, idx % 2 === 0 ? defaultResolution.width : defaultResolution.height);
				const value = loc.getAttribute("value") ?? "0";
				rows.push({
					key: cornerLabels[idx],
					value: `${value} @ ${resolution}`,
					isDefault: false
				});
			}
			else for (const key of cornerLabels) rows.push({
				key,
				value: "—",
				isDefault: false
			});
			const headTextPreview = (headEl, maxLen = 72) => {
				const text = headEl.textContent?.replace(/\s+/g, " ").trim() ?? "";
				if (!text) return "—";
				return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
			};
			rows.push({
				key: "caption",
				value: captionEl ? headTextPreview(captionEl) : "—",
				isDefault: !captionEl
			});
			rows.push({
				key: "description",
				value: descriptionEl ? headTextPreview(descriptionEl) : "—",
				isDefault: !descriptionEl
			});
			rows.push({
				key: "summary",
				value: summaryEl ? headTextPreview(summaryEl) : "—",
				isDefault: !summaryEl
			});
			rows.push({
				key: "custom",
				value: customEl ? headTextPreview(customEl) : "—",
				isDefault: !customEl
			});
			return rows;
		}
	};
	DoclangPageViewPane = __decorate([t$2("doclang-page-view-pane")], DoclangPageViewPane);
	//#endregion
	//#region src/components/reading-pane/reading-pane.css?inline
	var reading_pane_default = ":host {\n  display: flex;\n  flex-direction: column;\n  border-right: 1px solid var(--border);\n  min-height: 0;\n  min-width: 0;\n}\n:host([hidden]) {\n  display: none !important;\n}\n:host(.pane-layout-last) {\n  border-right: none;\n}\n.pane-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  box-sizing: border-box;\n  height: 2.125rem;\n  padding: 0 0.75rem;\n  font-size: 0.75rem;\n  font-weight: 600;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  color: var(--muted);\n  border-bottom: 1px solid var(--border);\n  background: var(--panel);\n}\n.pane-header-title {\n  min-width: 0;\n}\n.pane-settings-toggle {\n  appearance: none;\n  border: 1px solid transparent;\n  background: transparent;\n  color: var(--muted);\n  font-weight: 500;\n  cursor: pointer;\n  white-space: nowrap;\n  flex-shrink: 0;\n  display: inline-flex;\n  align-items: center;\n  transition:\n    color 0.12s ease,\n    background 0.12s ease,\n    border-color 0.12s ease;\n  border-radius: 0.25rem;\n  padding: 0 0.28rem 0 0.4rem;\n  height: 1.25rem;\n  font-size: 0.625rem;\n  font-weight: 600;\n  line-height: 1;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  font: inherit;\n}\n.pane-settings-toggle::after {\n  content: '';\n  flex-shrink: 0;\n  width: 0.26rem;\n  height: 0.26rem;\n  margin-left: 0.22rem;\n  margin-top: -0.1em;\n  border-right: 1.5px solid currentColor;\n  border-bottom: 1.5px solid currentColor;\n  transform: rotate(45deg);\n  opacity: 0.65;\n}\n.pane-settings-toggle:hover {\n  color: var(--text);\n  background: color-mix(in srgb, var(--text) 5%, transparent);\n}\n.pane-settings-toggle[aria-expanded='true'] {\n  color: var(--accent);\n  background: color-mix(in srgb, var(--accent) 10%, var(--panel));\n  border-color: color-mix(in srgb, var(--accent) 22%, transparent);\n}\n.pane-settings-toggle:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: 2px;\n}\n.pane-reading-layout {\n  position: relative;\n  flex: 1;\n  min-height: 0;\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n}\n.pane-body {\n  flex: 1 1 auto;\n  min-width: 0;\n  min-height: 0;\n  overflow: auto;\n  padding: 1rem;\n}\n.viewer-settings-layer {\n  position: absolute;\n  inset: 0;\n  z-index: 5;\n}\n.viewer-settings-layer[hidden] {\n  display: none;\n}\n.viewer-settings-scrim {\n  position: absolute;\n  inset: 0;\n  z-index: 0;\n  appearance: none;\n  border: none;\n  margin: 0;\n  padding: 0;\n  background: color-mix(in srgb, var(--bg) 28%, transparent);\n  cursor: default;\n}\n.viewer-settings {\n  position: absolute;\n  top: 0.5rem;\n  right: 0.5rem;\n  z-index: 1;\n  width: 13rem;\n  max-height: calc(100% - 1rem);\n  display: flex;\n  flex-direction: column;\n  min-height: 0;\n  border: 1px solid var(--border);\n  border-radius: 0.5rem;\n  background: var(--panel);\n  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.14);\n  overflow: hidden;\n}\n.viewer-settings-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.5rem;\n  padding: 0.5rem 0.75rem;\n  border-bottom: 1px solid var(--border);\n}\n.viewer-settings-title {\n  margin: 0;\n  font-size: 0.6875rem;\n  font-weight: 600;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  color: var(--muted);\n}\n.viewer-settings-close {\n  appearance: none;\n  border: none;\n  background: transparent;\n  color: var(--muted);\n  width: 1.5rem;\n  height: 1.5rem;\n  border-radius: 0.25rem;\n  font-size: 1.1rem;\n  line-height: 1;\n  cursor: pointer;\n}\n.viewer-settings-close:hover {\n  color: var(--text);\n  background: var(--bg);\n}\n.viewer-settings-body {\n  padding: 0.75rem;\n  overflow: auto;\n}\n.settings-option {\n  display: flex;\n  align-items: flex-start;\n  gap: 0.5rem;\n  font-size: 0.875rem;\n  cursor: pointer;\n  user-select: none;\n}\n.settings-subgroup {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n  padding-left: 0.85rem;\n}\n.settings-option-sub {\n  font-size: 0.8125rem;\n  color: var(--muted);\n}\n.settings-option input {\n  margin: 0.15rem 0 0;\n  flex-shrink: 0;\n  cursor: pointer;\n}\n.rendered-doc {\n  max-width: 42rem;\n  margin: 0 auto;\n  line-height: 1.6;\n}\n.rendered-el-virtual-text > p,\n.rendered-el-virtual-text > div {\n  margin: 0;\n  display: inline;\n}\n.rendered-doc li > .rendered-el-virtual-text {\n  display: inline;\n}\n.rendered-doc li > .rendered-el-virtual-text > p,\n.rendered-doc li > .rendered-el-virtual-text > div {\n  display: inline;\n  margin: 0;\n}\n.rendered-table .rendered-el-virtual-text {\n  display: inline;\n  margin: 0;\n}\n.rendered-table .rendered-el-virtual-text > p,\n.rendered-table .rendered-el-virtual-text > div {\n  display: inline;\n  margin: 0;\n}\n.rendered-el-virtual-text > div > .rendered-el {\n  display: block;\n  margin: 0.25rem 0;\n}\n.rendered-el {\n  cursor: pointer;\n  border-radius: 0.25rem;\n}\n.rendered-el:hover {\n  outline: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);\n}\n.rendered-el.selected {\n  outline: 2px solid var(--accent);\n  outline-offset: 2px;\n  background: color-mix(in srgb, var(--accent) 8%, transparent);\n}\n.rendered-doc p {\n  margin: 0 0 0.75rem;\n}\n.rendered-doc h1,\n.rendered-doc h2,\n.rendered-doc h3,\n.rendered-doc h4,\n.rendered-doc h5,\n.rendered-doc h6 {\n  margin: 1.25rem 0 0.5rem;\n  line-height: 1.25;\n}\n.rendered-doc h1:first-child,\n.rendered-doc h2:first-child,\n.rendered-doc h3:first-child {\n  margin-top: 0;\n}\n.rendered-doc ul,\n.rendered-doc ol {\n  margin: 0 0 0.75rem;\n  padding-left: 1.5rem;\n}\n.rendered-doc li {\n  margin: 0.25rem 0;\n}\n.rendered-doc li > .rendered-el > p:first-child,\n.rendered-doc li > .rendered-el > h1:first-child,\n.rendered-doc li > .rendered-el > h2:first-child,\n.rendered-doc li > .rendered-el > h3:first-child,\n.rendered-doc li > .rendered-el > h4:first-child,\n.rendered-doc li > .rendered-el > h5:first-child,\n.rendered-doc li > .rendered-el > h6:first-child {\n  margin-top: 0;\n}\n.rendered-marker {\n  margin-right: 0.35rem;\n}\n.rendered-handwriting {\n  font-family: 'Segoe Print', 'Bradley Hand', cursive;\n}\n.rendered-doc pre {\n  margin: 0 0 0.75rem;\n  padding: 0.75rem 1rem;\n  overflow-x: auto;\n  font-family: var(--font-mono);\n  font-size: 0.8125rem;\n  line-height: 1.5;\n  background: var(--placeholder-bg);\n  border: 1px solid var(--border);\n  border-radius: 0.375rem;\n}\n.rendered-doc code {\n  font-family: var(--font-mono);\n  font-size: 0.875em;\n}\n.rendered-doc pre code {\n  font-size: inherit;\n  background: none;\n  border: none;\n  padding: 0;\n}\n.rendered-code-label {\n  display: block;\n  margin-bottom: 0.25rem;\n  font-size: 0.75rem;\n  font-weight: 600;\n  color: var(--muted);\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n}\n.rendered-formula {\n  display: block;\n  margin: 0 0 0.75rem;\n  padding: 0.5rem 0.75rem;\n  font-family: var(--font-mono);\n  font-size: 0.875rem;\n  background: var(--placeholder-bg);\n  border-left: 3px solid var(--border);\n  overflow-x: auto;\n}\n.rendered-formula-inline {\n  display: inline;\n  font-family: var(--font-mono);\n  font-size: 0.875em;\n}\n.rendered-doc figure {\n  margin: 0 0 0.75rem;\n}\n.rendered-doc figure img {\n  max-width: 100%;\n  height: auto;\n  border: 1px solid var(--border);\n  border-radius: 0.25rem;\n}\n.rendered-doc figure img.rendered-picture-unavailable {\n  display: inline-block;\n  min-width: 3rem;\n  min-height: 2.5rem;\n  object-fit: contain;\n  vertical-align: middle;\n}\n.rendered-doc figcaption {\n  margin-top: 0.35rem;\n  font-size: 0.875rem;\n  color: var(--muted);\n}\n.rendered-picture-contents {\n  margin-top: 0.5rem;\n  font-size: 0.875rem;\n  border: 1px solid var(--border);\n  border-radius: 0.375rem;\n  background: var(--placeholder-bg);\n}\n.rendered-picture-contents summary {\n  padding: 0.4rem 0.65rem;\n  cursor: pointer;\n  font-weight: 600;\n  color: var(--muted);\n  user-select: none;\n}\n.rendered-picture-contents summary:hover {\n  color: var(--text);\n}\n.rendered-picture-contents-body {\n  padding: 0.5rem 0.75rem 0.75rem;\n  border-top: 1px solid var(--border);\n}\n.rendered-picture-contents-body .rendered-el > p {\n  margin-bottom: 0.35rem;\n  font-size: 0.8125rem;\n}\n.rendered-table {\n  width: 100%;\n  margin: 0 0 0.75rem;\n  border-collapse: collapse;\n  font-size: 0.875rem;\n}\n.rendered-table caption {\n  caption-side: top;\n  margin-bottom: 0.35rem;\n  font-size: 0.875rem;\n  color: var(--muted);\n  text-align: left;\n}\n.rendered-table th,\n.rendered-table td {\n  border: 1px solid var(--border);\n  padding: 0.35rem 0.5rem;\n  vertical-align: top;\n  text-align: left;\n}\n.rendered-table th {\n  background: color-mix(in srgb, var(--border) 35%, var(--panel));\n  font-weight: 600;\n}\n.rendered-table .rendered-table-cell-text {\n  display: inline;\n}\n.rendered-table .rendered-el {\n  margin: 0;\n}\n.rendered-table .rendered-el-virtual-text > p,\n.rendered-table .rendered-el-virtual-text > div {\n  margin: 0;\n}\n.rendered-table .rendered-table {\n  margin: 0.25rem 0 0;\n}\n.rendered-page-header,\n.rendered-page-footer {\n  font-size: 0.875rem;\n  color: var(--muted);\n}\n.rendered-page-header {\n  margin-bottom: 1rem;\n  padding-bottom: 0.5rem;\n  border-bottom: 1px solid var(--border);\n}\n.rendered-page-footer {\n  margin-top: 1rem;\n  padding-top: 0.5rem;\n  border-top: 1px solid var(--border);\n}\n.pane-body:not(.show-reading-furniture)\n  .rendered-el[data-doclang-layer='furniture'] {\n  display: none;\n}\n.pane-body:not(.show-reading-background)\n  .rendered-el[data-doclang-layer='background'] {\n  display: none;\n}\n.rendered-el[data-doclang-layer='furniture'],\n.rendered-el[data-doclang-layer='background'] {\n  position: relative;\n}\n.rendered-el[data-doclang-layer='furniture']::before,\n.rendered-el[data-doclang-layer='background']::before {\n  content: '';\n  position: absolute;\n  inset: 0;\n  border-radius: inherit;\n  pointer-events: none;\n  background: repeating-linear-gradient(\n    -45deg,\n    transparent 0 10px,\n    color-mix(in srgb, var(--muted) 6%, transparent) 10px 16px\n  );\n}\n.rendered-el.rendered-footnote > aside {\n  font-size: 0.875rem;\n  color: var(--muted);\n  border-left: 2px solid var(--border);\n  padding-left: 0.75rem;\n  margin: 0 0 0.75rem;\n}\n.rendered-unsupported {\n  margin: 0 0 0.75rem;\n  padding: 0.5rem 0.75rem;\n  font-size: 0.8125rem;\n  font-style: italic;\n  color: var(--muted);\n  background: var(--placeholder-bg);\n  border: 1px dashed var(--border);\n  border-radius: 0.375rem;\n}\n.rendered-field-region {\n  margin: 0 0 1rem;\n  padding: 0.75rem 1rem;\n  border: 1px solid var(--border);\n  border-radius: 0.5rem;\n  background: color-mix(in srgb, var(--kind-field) 6%, transparent);\n}\n.rendered-field-region > .rendered-field-heading:first-child,\n.rendered-field-region\n  > .rendered-el.rendered-field_heading\n  > .rendered-field-heading:first-child {\n  margin-top: 0;\n}\n.rendered-field-item {\n  margin: 0.5rem 0;\n}\n.rendered-field-item > .rendered-el.rendered-field-key,\n.rendered-field-key {\n  font-weight: 600;\n}\n.rendered-field-item > .rendered-el.rendered-field-key + .rendered-el,\n.rendered-field-item > .rendered-el.rendered-field-key + .rendered-el-virtual-text {\n  margin-top: 0.15rem;\n}\n.rendered-field-value-fillable .rendered-field-fillable-slot {\n  display: inline-block;\n  min-width: 6rem;\n  min-height: 1.25em;\n  border-bottom: 1px solid color-mix(in srgb, var(--text) 55%, transparent);\n  vertical-align: bottom;\n}\n.rendered-field-hint {\n  font-size: 0.85em;\n  color: var(--muted);\n  font-style: italic;\n}\n.rendered-field-heading {\n  color: var(--text);\n}\n.rendered-checkbox {\n  margin: 0 0.25rem 0 0;\n  vertical-align: middle;\n  accent-color: var(--kind-field);\n}\n.rendered-checkbox-wrap {\n  display: inline;\n}\n";
	//#endregion
	//#region src/components/reading-pane/reading-pane.ts
	/** <doclang-reading-pane> — reading/rendered view with layers settings panel */
	init_document();
	init_dom();
	var RENDER_BLOCK_TAGS = /* @__PURE__ */ new Set([
		"text",
		"heading",
		"field_heading",
		"footnote",
		"page_header",
		"page_footer",
		"list",
		"code",
		"formula",
		"picture",
		"group",
		"field_region",
		"field_item",
		"table",
		"index",
		"tabular"
	]);
	var RENDER_FORMAT_TAGS = /* @__PURE__ */ new Set([
		"bold",
		"italic",
		"underline",
		"strikethrough",
		"superscript",
		"subscript",
		"handwriting",
		"rtl",
		"content"
	]);
	var FORMAT_HTML_TAG = {
		bold: "strong",
		italic: "em",
		underline: "u",
		strikethrough: "s",
		superscript: "sup",
		subscript: "sub"
	};
	var PICTURE_UNAVAILABLE_ALT = "Picture asset not available";
	var INVALID_PICTURE_SRC = "data:image/png;base64,NOT_A_VALID_IMAGE";
	/** Allow small embedded raster data URIs only; remote/blob/other schemes are rejected. */
	var SAFE_DATA_IMAGE_RE = /^data:image\/(png|jpe?g|webp|gif);base64,/i;
	var MAX_DATA_IMAGE_URI_LENGTH = 2097152;
	function applyElementLayerAttr(sourceEl, domEl) {
		domEl.setAttribute("data-doclang-layer", elementLayer(sourceEl));
	}
	function resolveArchiveUri(uri, assetUrls) {
		if (!uri) return null;
		const trimmed = uri.trim();
		if (!trimmed) return null;
		if (SAFE_DATA_IMAGE_RE.test(trimmed)) return trimmed.length <= MAX_DATA_IMAGE_URI_LENGTH ? trimmed : null;
		if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) return null;
		return assetUrls?.get(normalizeArchivePath(trimmed)) ?? null;
	}
	function markPictureUnavailable(img) {
		img.classList.add("rendered-picture-unavailable");
		img.alt = "\xA0";
		img.setAttribute("aria-label", PICTURE_UNAVAILABLE_ALT);
	}
	function appendPictureFigureImage(figure, uri, captionEl, elementIds, assetUrls) {
		const img = document.createElement("img");
		figure.appendChild(img);
		const resolved = uri ? resolveArchiveUri(uri, assetUrls) : null;
		if (resolved) {
			img.alt = "";
			img.src = resolved;
			img.addEventListener("error", () => markPictureUnavailable(img), { once: true });
		} else {
			markPictureUnavailable(img);
			img.src = INVALID_PICTURE_SRC;
		}
		if (captionEl) figure.appendChild(renderEmbeddedCaption(captionEl, elementIds, "figcaption", assetUrls));
	}
	function readCaptionElement(el) {
		return childElements(el).find((c) => localName(c) === "caption") ?? null;
	}
	function renderEmbeddedCaption(captionEl, elementIds, tagName, assetUrls) {
		const node = document.createElement(tagName);
		node.classList.add("rendered-el", "rendered-caption");
		const elementId = elementIds.get(captionEl);
		if (elementId) node.setAttribute("data-element-id", elementId);
		appendRenderedBody(node, captionEl, elementIds, { inline: true }, assetUrls);
		return node;
	}
	function wrapRendered(el, node, elementId, extraClass) {
		const tag = localName(el);
		const wrap = document.createElement("div");
		wrap.className = `rendered-el rendered-${tag}${extraClass ? ` ${extraClass}` : ""}`;
		if (elementId) wrap.setAttribute("data-element-id", elementId);
		applyElementLayerAttr(el, wrap);
		wrap.appendChild(node);
		return wrap;
	}
	function appendRenderedBody(parent, el, elementIds, ctx, assetUrls) {
		const nodes = [...el.childNodes];
		let i = skipElementHeadNodes(nodes, 0);
		while (i < nodes.length) {
			appendRenderedNode(parent, nodes[i], elementIds, ctx, assetUrls);
			i += 1;
		}
	}
	function appendRenderedBodyBlocks(parent, el, elementIds, assetUrls) {
		const nodes = [...el.childNodes];
		let i = skipElementHeadNodes(nodes, 0);
		while (i < nodes.length) {
			const node = nodes[i];
			if (node.nodeType === Node.ELEMENT_NODE && RENDER_BLOCK_TAGS.has(localName(node))) {
				const rendered = renderBlockElement(node, elementIds, { inline: false }, assetUrls);
				if (rendered) parent.appendChild(rendered);
			} else appendRenderedNode(parent, node, elementIds, { inline: false }, assetUrls);
			i += 1;
		}
	}
	function renderMarkerElement(el, elementIds, ctx, assetUrls) {
		const marker = document.createElement("span");
		marker.className = "rendered-marker rendered-el";
		const elementId = elementIds.get(el);
		if (elementId) marker.setAttribute("data-element-id", elementId);
		appendRenderedBody(marker, el, elementIds, ctx, assetUrls);
		return marker;
	}
	function renderCheckboxElement(el, elementIds) {
		const cb = document.createElement("input");
		cb.type = "checkbox";
		cb.disabled = true;
		cb.checked = (el.getAttribute("class") ?? "unselected") === "selected";
		cb.className = "rendered-checkbox";
		const wrap = document.createElement("span");
		wrap.className = "rendered-checkbox-wrap rendered-el";
		const elementId = elementIds.get(el);
		if (elementId) wrap.setAttribute("data-element-id", elementId);
		applyElementLayerAttr(el, wrap);
		wrap.appendChild(cb);
		return wrap;
	}
	function renderFieldKeyElement(el, elementIds, ctx, assetUrls) {
		const node = document.createElement("span");
		node.className = "rendered-field-key rendered-el";
		const elementId = elementIds.get(el);
		if (elementId) node.setAttribute("data-element-id", elementId);
		applyElementLayerAttr(el, node);
		appendRenderedBody(node, el, elementIds, {
			...ctx,
			inline: true
		}, assetUrls);
		return node;
	}
	function renderFieldValueElement(el, elementIds, ctx, assetUrls) {
		const valueClass = el.getAttribute("class") ?? "read_only";
		const node = document.createElement("span");
		node.className = `rendered-field-value rendered-field-value-${valueClass} rendered-el`;
		const elementId = elementIds.get(el);
		if (elementId) node.setAttribute("data-element-id", elementId);
		applyElementLayerAttr(el, node);
		appendRenderedBody(node, el, elementIds, {
			...ctx,
			inline: true
		}, assetUrls);
		if (valueClass === "fillable" && !node.textContent?.trim() && !node.querySelector(".rendered-checkbox-wrap, img, .rendered-marker")) {
			const slot = document.createElement("span");
			slot.className = "rendered-field-fillable-slot";
			slot.setAttribute("aria-hidden", "true");
			node.appendChild(slot);
		}
		return node;
	}
	function renderFieldHintElement(el, elementIds, ctx, assetUrls) {
		const node = document.createElement("span");
		node.className = "rendered-field-hint rendered-el";
		const elementId = elementIds.get(el);
		if (elementId) node.setAttribute("data-element-id", elementId);
		applyElementLayerAttr(el, node);
		appendRenderedBody(node, el, elementIds, {
			...ctx,
			inline: true
		}, assetUrls);
		return node;
	}
	function renderFormatElement(el, elementIds, ctx, assetUrls) {
		const tag = localName(el);
		if (tag === "content") {
			const span = document.createElement("span");
			span.textContent = el.textContent ?? "";
			return span;
		}
		let node;
		if (tag === "handwriting") {
			node = document.createElement("span");
			node.className = "rendered-handwriting";
		} else if (tag === "rtl") {
			node = document.createElement("bdi");
			node.setAttribute("dir", "rtl");
		} else node = document.createElement(FORMAT_HTML_TAG[tag] ?? "span");
		appendRenderedBody(node, el, elementIds, ctx, assetUrls);
		return node;
	}
	function renderCode(el, elementIds, ctx, assetUrls) {
		const labelValue = childElements(el).find((c) => localName(c) === "label")?.getAttribute("value");
		const code = document.createElement("code");
		appendRenderedBody(code, el, elementIds, { inline: ctx.inline }, assetUrls);
		if (ctx.inline) {
			code.classList.add("rendered-el");
			const id = elementIds.get(el);
			if (id) code.setAttribute("data-element-id", id);
			return code;
		}
		const pre = document.createElement("pre");
		if (labelValue && labelValue !== "undefined") {
			const label = document.createElement("span");
			label.className = "rendered-code-label";
			label.textContent = labelValue;
			pre.appendChild(label);
		}
		pre.appendChild(code);
		return wrapRendered(el, pre, elementIds.get(el));
	}
	function renderFormula(el, elementIds, ctx, assetUrls) {
		const span = document.createElement("span");
		span.className = ctx.inline ? "rendered-formula-inline" : "rendered-formula";
		appendRenderedBody(span, el, elementIds, { inline: true }, assetUrls);
		if (ctx.inline) {
			span.classList.add("rendered-el");
			const id = elementIds.get(el);
			if (id) span.setAttribute("data-element-id", id);
			return span;
		}
		return wrapRendered(el, span, elementIds.get(el));
	}
	function renderPicture(el, elementIds, assetUrls) {
		const figure = document.createElement("figure");
		const captionEl = readCaptionElement(el);
		appendPictureFigureImage(figure, (childElements(el).find((c) => localName(c) === "src") ?? null)?.getAttribute("uri")?.trim() || null, captionEl, elementIds, assetUrls);
		const nodes = [...el.childNodes];
		let i = skipElementHeadNodes(nodes, 0);
		while (i < nodes.length) {
			const node = nodes[i];
			if (node.nodeType !== Node.ELEMENT_NODE) {
				i += 1;
				continue;
			}
			const tag = localName(node);
			if (tag === "src") {
				i += 1;
				continue;
			}
			if (tag === "tabular") {
				const rendered = renderOtslContainer(node, elementIds, assetUrls);
				if (rendered) figure.appendChild(rendered);
				i += 1;
				continue;
			}
			break;
		}
		const bodyInner = document.createElement("div");
		bodyInner.className = "rendered-picture-contents-body";
		appendPictureBodyContent(bodyInner, nodes, i, elementIds, assetUrls);
		if (bodyInner.textContent?.trim()) {
			const details = document.createElement("details");
			details.className = "rendered-picture-contents";
			const summary = document.createElement("summary");
			summary.textContent = "Picture contents";
			details.appendChild(summary);
			details.appendChild(bodyInner);
			figure.appendChild(details);
		}
		return wrapRendered(el, figure, elementIds.get(el));
	}
	function appendPictureBodyContent(container, nodes, startIdx, elementIds, assetUrls) {
		let i = startIdx;
		while (i < nodes.length) {
			const node = nodes[i];
			if (node.nodeType === Node.ELEMENT_NODE && RENDER_BLOCK_TAGS.has(localName(node))) {
				const rendered = renderBlockElement(node, elementIds, { inline: false }, assetUrls);
				if (rendered) container.appendChild(rendered);
			} else appendRenderedNode(container, node, elementIds, { inline: false }, assetUrls);
			i += 1;
		}
	}
	function renderVirtualTextBlock(hostEl, contentNodes, elementIds, assetUrls) {
		const hasBlock = contentNodes.some((n) => n.nodeType === Node.ELEMENT_NODE && RENDER_BLOCK_TAGS.has(localName(n)));
		const inner = document.createElement(hasBlock ? "div" : "p");
		for (const node of contentNodes) if (node.nodeType === Node.ELEMENT_NODE && RENDER_BLOCK_TAGS.has(localName(node))) {
			const rendered = renderBlockElement(node, elementIds, { inline: false }, assetUrls);
			if (rendered) inner.appendChild(rendered);
		} else appendRenderedNode(inner, node, elementIds, { inline: true }, assetUrls);
		const wrap = document.createElement("div");
		wrap.className = "rendered-el rendered-text rendered-el-virtual-text";
		const elementId = elementIds.get(hostEl);
		if (elementId) wrap.setAttribute("data-element-id", elementId);
		applyElementLayerAttr(hostEl, wrap);
		wrap.appendChild(inner);
		return wrap;
	}
	function sliceHasMarkupContent(nodes) {
		for (let i = 0; i < nodes.length; i += 1) {
			const node = nodes[i];
			if (!node) continue;
			if (isTextLikeNode(node) && !isWhitespaceOnlyText(node)) return true;
			if (node.nodeType === Node.ELEMENT_NODE) return true;
		}
		return false;
	}
	function isVirtualTextSkippableNode(node) {
		if (isWhitespaceOnlyText(node)) return true;
		if (node.nodeType !== Node.ELEMENT_NODE) return false;
		const tag = localName(node);
		return tag === "location" || HEAD_TAGS.has(tag);
	}
	function shouldWrapVirtualText(contentNodes) {
		if (!sliceHasMarkupContent(contentNodes)) return false;
		for (const node of contentNodes) {
			if (isVirtualTextSkippableNode(node)) continue;
			if (isTextLikeNode(node)) return true;
			if (node.nodeType === Node.ELEMENT_NODE && !isSemanticElement(node)) return true;
		}
		return false;
	}
	function appendRenderedSliceContent(container, hostEl, contentNodes, elementIds, assetUrls) {
		if (!sliceHasMarkupContent(contentNodes)) return;
		if (shouldWrapVirtualText(contentNodes)) {
			container.appendChild(renderVirtualTextBlock(hostEl, contentNodes, elementIds, assetUrls));
			return;
		}
		for (const node of contentNodes) {
			if (isVirtualTextSkippableNode(node)) continue;
			if (node.nodeType === Node.ELEMENT_NODE && RENDER_BLOCK_TAGS.has(localName(node))) {
				const rendered = renderBlockElement(node, elementIds, { inline: false }, assetUrls);
				if (rendered) container.appendChild(rendered);
			} else appendRenderedNode(container, node, elementIds, { inline: true }, assetUrls);
		}
	}
	function appendListItemsFromElement(list, el, elementIds, assetUrls) {
		const nodes = [...el.childNodes];
		let i = skipContainerLevelHead(nodes, 0);
		while (i < nodes.length) {
			const node = nodes[i];
			if (node.nodeType !== Node.ELEMENT_NODE || localName(node) !== "ldiv") {
				i += 1;
				continue;
			}
			const ldiv = node;
			i += 1;
			const li = document.createElement("li");
			for (const child of childElements(ldiv)) {
				const childTag = localName(child);
				if (childTag === "marker") li.appendChild(renderMarkerElement(child, elementIds, { inline: true }, assetUrls));
				else if (childTag === "checkbox") li.appendChild(renderCheckboxElement(child, elementIds));
			}
			const contentStart = i;
			const head = parseElementHeadAt(nodes, i);
			if (head) i = head.nextIndex;
			while (i < nodes.length) {
				const contentNode = nodes[i];
				if (contentNode.nodeType === Node.ELEMENT_NODE && localName(contentNode) === "ldiv") break;
				i += 1;
			}
			appendRenderedSliceContent(li, ldiv, nodes.slice(contentStart, i), elementIds, assetUrls);
			list.appendChild(li);
		}
	}
	function renderList(el, elementIds, assetUrls) {
		const listClass = el.getAttribute("class") ?? "unordered";
		const list = document.createElement(listClass === "ordered" ? "ol" : "ul");
		appendListItemsFromElement(list, el, elementIds, assetUrls);
		return wrapRendered(el, list, elementIds.get(el));
	}
	function isHeaderCellKind(kind) {
		return kind === "ched" || kind === "rhed" || kind === "corn" || kind === "srow";
	}
	function parseOtslRows(container) {
		const nodes = [...container.childNodes];
		let i = skipOtslContainerHead(nodes, 0);
		const rows = [];
		let currentRow = [];
		while (i < nodes.length) {
			const node = nodes[i];
			if (node.nodeType !== Node.ELEMENT_NODE) {
				i += 1;
				continue;
			}
			const tag = localName(node);
			if (tag === "nl") {
				rows.push(currentRow);
				currentRow = [];
				i += 1;
				continue;
			}
			if (!isCellToken(tag)) {
				i += 1;
				continue;
			}
			if (CELL_SPAN_TAGS.has(tag)) {
				currentRow.push({
					kind: tag,
					token: node,
					contentNodes: []
				});
				i += 1;
				continue;
			}
			i += 1;
			const head = parseElementHeadAt(nodes, i);
			if (head) i = head.nextIndex;
			const contentStart = i;
			i = skipUntilCellBoundary(nodes, i);
			currentRow.push({
				kind: tag,
				token: node,
				contentNodes: nodes.slice(contentStart, i)
			});
		}
		if (currentRow.length) rows.push(currentRow);
		return rows;
	}
	function findVerticalCellOrigin(grid, row, col) {
		for (let r = row - 1; r >= 0; r -= 1) {
			const cell = grid[r]?.[col];
			if (!cell || cell.covered) continue;
			return {
				cell,
				row: r,
				col
			};
		}
		return null;
	}
	function findHorizontalCellOrigin(grid, row, col) {
		for (let c = col - 1; c >= 0; c -= 1) {
			const cell = grid[row]?.[c];
			if (!cell || cell.covered) continue;
			return {
				cell,
				row,
				col: c
			};
		}
		return null;
	}
	function nextFreeColumn(grid, row, col) {
		let c = col;
		while (grid[row]?.[c]?.covered) c += 1;
		return c;
	}
	function buildOtslGrid(rows) {
		const grid = [];
		for (let rowIdx = 0; rowIdx < rows.length; rowIdx += 1) {
			if (!grid[rowIdx]) grid[rowIdx] = [];
			let col = 0;
			for (const parsed of rows[rowIdx]) {
				col = nextFreeColumn(grid, rowIdx, col);
				if (parsed.kind === "lcel") {
					const origin = findHorizontalCellOrigin(grid, rowIdx, col);
					if (origin) origin.cell.colspan += 1;
					grid[rowIdx][col] = {
						kind: "lcel",
						token: parsed.token,
						contentNodes: [],
						colspan: 0,
						rowspan: 0,
						covered: true
					};
					col += 1;
					continue;
				}
				if (parsed.kind === "ucel") {
					const origin = findVerticalCellOrigin(grid, rowIdx, col);
					if (origin) origin.cell.rowspan += 1;
					grid[rowIdx][col] = {
						kind: "ucel",
						token: parsed.token,
						contentNodes: [],
						colspan: 0,
						rowspan: 0,
						covered: true
					};
					col += 1;
					continue;
				}
				if (parsed.kind === "xcel") {
					const vOrigin = findVerticalCellOrigin(grid, rowIdx, col);
					const hOrigin = findHorizontalCellOrigin(grid, rowIdx, col);
					if (vOrigin && hOrigin && vOrigin.cell === hOrigin.cell) {
						vOrigin.cell.rowspan += 1;
						vOrigin.cell.colspan += 1;
					} else {
						if (vOrigin) vOrigin.cell.rowspan += 1;
						if (hOrigin) hOrigin.cell.colspan += 1;
					}
					grid[rowIdx][col] = {
						kind: "xcel",
						token: parsed.token,
						contentNodes: [],
						colspan: 0,
						rowspan: 0,
						covered: true
					};
					col += 1;
					continue;
				}
				grid[rowIdx][col] = {
					kind: parsed.kind,
					token: parsed.token,
					contentNodes: parsed.contentNodes,
					colspan: 1,
					rowspan: 1,
					covered: false
				};
				col += 1;
			}
		}
		return grid;
	}
	function renderOtslContainer(el, elementIds, assetUrls) {
		const table = document.createElement("table");
		table.className = "rendered-table";
		const captionEl = readCaptionElement(el);
		if (captionEl) table.appendChild(renderEmbeddedCaption(captionEl, elementIds, "caption", assetUrls));
		const grid = buildOtslGrid(parseOtslRows(el));
		const tbody = document.createElement("tbody");
		for (const row of grid) {
			const tr = document.createElement("tr");
			for (const cell of row ?? []) {
				if (!cell || cell.covered) continue;
				const cellTag = isHeaderCellKind(cell.kind) ? "th" : "td";
				const td = document.createElement(cellTag);
				if (cell.colspan > 1) td.colSpan = cell.colspan;
				if (cell.rowspan > 1) td.rowSpan = cell.rowspan;
				appendRenderedSliceContent(td, cell.token, cell.contentNodes, elementIds, assetUrls);
				tr.appendChild(td);
			}
			if (tr.childNodes.length) tbody.appendChild(tr);
		}
		if (tbody.childNodes.length) table.appendChild(tbody);
		return wrapRendered(el, table, elementIds.get(el));
	}
	function renderUnsupported(el, elementIds) {
		const stub = document.createElement("div");
		stub.className = "rendered-unsupported";
		stub.textContent = `<${localName(el)}> — not yet rendered`;
		return wrapRendered(el, stub, elementIds.get(el));
	}
	function renderBlockElement(el, elementIds, ctx, assetUrls) {
		const tag = localName(el);
		const elementId = elementIds.get(el);
		switch (tag) {
			case "text": {
				const p = document.createElement("p");
				appendRenderedBody(p, el, elementIds, { inline: true }, assetUrls);
				return wrapRendered(el, p, elementId);
			}
			case "heading": {
				const h = document.createElement(`h${headingLevel(el)}`);
				appendRenderedBody(h, el, elementIds, { inline: true }, assetUrls);
				return wrapRendered(el, h, elementId);
			}
			case "field_heading": {
				const h = document.createElement(`h${headingLevel(el)}`);
				h.className = "rendered-field-heading";
				appendRenderedBody(h, el, elementIds, { inline: true }, assetUrls);
				return wrapRendered(el, h, elementId);
			}
			case "footnote": {
				const aside = document.createElement("aside");
				appendRenderedBody(aside, el, elementIds, { inline: false }, assetUrls);
				return wrapRendered(el, aside, elementId);
			}
			case "page_header": {
				const header = document.createElement("header");
				header.className = "rendered-page-header";
				appendRenderedBody(header, el, elementIds, { inline: true }, assetUrls);
				return wrapRendered(el, header, elementId);
			}
			case "page_footer": {
				const footer = document.createElement("footer");
				footer.className = "rendered-page-footer";
				appendRenderedBody(footer, el, elementIds, { inline: true }, assetUrls);
				return wrapRendered(el, footer, elementId);
			}
			case "list": return renderList(el, elementIds, assetUrls);
			case "table":
			case "index":
			case "tabular": return renderOtslContainer(el, elementIds, assetUrls);
			case "code": return renderCode(el, elementIds, ctx, assetUrls);
			case "formula": return renderFormula(el, elementIds, ctx, assetUrls);
			case "picture": return renderPicture(el, elementIds, assetUrls);
			case "group": {
				const figure = document.createElement("figure");
				figure.className = "rendered-group";
				appendRenderedBodyBlocks(figure, el, elementIds, assetUrls);
				const cap = readCaptionElement(el);
				if (cap) figure.appendChild(renderEmbeddedCaption(cap, elementIds, "figcaption", assetUrls));
				return wrapRendered(el, figure, elementId);
			}
			case "field_region": {
				const div = document.createElement("div");
				div.className = "rendered-field-region";
				appendRenderedBodyBlocks(div, el, elementIds, assetUrls);
				return wrapRendered(el, div, elementId);
			}
			case "field_item": {
				const div = document.createElement("div");
				div.className = "rendered-field-item";
				appendRenderedBodyBlocks(div, el, elementIds, assetUrls);
				return wrapRendered(el, div, elementId);
			}
			default: return renderUnsupported(el, elementIds);
		}
	}
	function appendRenderedNode(parent, node, elementIds, ctx, assetUrls) {
		if (isTextLikeNode(node)) {
			let text = node.textContent;
			if (!text || !text.trim()) return;
			if (ctx.trimLeading) {
				text = text.replace(/^\s+/u, "");
				ctx.trimLeading = false;
				if (!text) return;
			}
			parent.appendChild(document.createTextNode(text));
			return;
		}
		if (node.nodeType !== Node.ELEMENT_NODE) return;
		const el = node;
		const tag = localName(el);
		if (HEAD_TAGS.has(tag)) return;
		if (RENDER_FORMAT_TAGS.has(tag)) {
			parent.appendChild(renderFormatElement(el, elementIds, ctx, assetUrls));
			return;
		}
		if (tag === "code" || tag === "formula") {
			const rendered = renderBlockElement(el, elementIds, { inline: true }, assetUrls);
			if (rendered) parent.appendChild(rendered);
			return;
		}
		if (RENDER_BLOCK_TAGS.has(tag)) {
			const rendered = renderBlockElement(el, elementIds, ctx, assetUrls);
			if (rendered) parent.appendChild(rendered);
			return;
		}
		if (tag === "marker") {
			parent.appendChild(renderMarkerElement(el, elementIds, ctx, assetUrls));
			return;
		}
		if (tag === "checkbox") {
			parent.appendChild(renderCheckboxElement(el, elementIds));
			return;
		}
		if (tag === "key") {
			parent.appendChild(renderFieldKeyElement(el, elementIds, ctx, assetUrls));
			return;
		}
		if (tag === "value") {
			parent.appendChild(renderFieldValueElement(el, elementIds, ctx, assetUrls));
			return;
		}
		if (tag === "hint") {
			parent.appendChild(renderFieldHintElement(el, elementIds, ctx, assetUrls));
			return;
		}
		if (tag === "ldiv") return;
		if (isCellToken(tag) || tag === "src" || tag === "tabular") return;
		appendRenderedBody(parent, el, elementIds, ctx, assetUrls);
	}
	function findLastTextNode(node) {
		if (isTextLikeNode(node)) return node;
		if (node.nodeType !== Node.ELEMENT_NODE) return null;
		for (let i = node.childNodes.length - 1; i >= 0; i -= 1) {
			const found = findLastTextNode(node.childNodes[i]);
			if (found) return found;
		}
		return null;
	}
	function trimParentTrailingForFragmentJoin(parent) {
		const lastText = findLastTextNode(parent);
		if (!lastText) return;
		let value = lastText.textContent ?? "";
		value = value.replace(/\s+$/u, "");
		if (value.endsWith("-")) value = value.slice(0, -1);
		if (!value) {
			lastText.parentNode?.removeChild(lastText);
			trimParentTrailingForFragmentJoin(parent);
			return;
		}
		lastText.textContent = value;
	}
	function appendMergedTextFragments(parent, fragments, elementIds, assetUrls) {
		for (let i = 0; i < fragments.length; i += 1) {
			if (i > 0) trimParentTrailingForFragmentJoin(parent);
			appendRenderedBody(parent, fragments[i], elementIds, {
				inline: true,
				trimLeading: i > 0
			}, assetUrls);
		}
	}
	function renderMergedIntraPageFragments(fragments, elementIds, assetUrls) {
		const first = fragments[0];
		const tag = localName(first);
		const firstId = elementIds.get(first);
		const threadId = elementThreadId(first);
		let node;
		if (tag === "text") {
			node = document.createElement("p");
			appendMergedTextFragments(node, fragments, elementIds, assetUrls);
		} else if (tag === "list") {
			const listClass = first.getAttribute("class") ?? "unordered";
			node = document.createElement(listClass === "ordered" ? "ol" : "ul");
			for (const el of fragments) appendListItemsFromElement(node, el, elementIds, assetUrls);
		} else {
			node = document.createElement("div");
			node.className = "rendered-fragment-merged-body";
			for (const el of fragments) appendRenderedBodyBlocks(node, el, elementIds, assetUrls);
		}
		const wrap = wrapRendered(first, node, firstId, "rendered-fragment-merged");
		if (threadId) wrap.setAttribute("data-thread-id", threadId);
		return wrap;
	}
	function collectIntraPageThreads(segment) {
		const byThread = /* @__PURE__ */ new Map();
		for (const el of segment) {
			if (el.nodeType !== Node.ELEMENT_NODE) continue;
			if (localName(el) === "page_break") continue;
			const tid = elementThreadId(el);
			if (!tid) continue;
			if (!byThread.has(tid)) byThread.set(tid, []);
			byThread.get(tid).push(el);
		}
		for (const [tid, members] of byThread) if (members.length < 2) byThread.delete(tid);
		return byThread;
	}
	var DoclangReadingPane = class DoclangReadingPane extends DoclangPageElement {
		static styles = r$6(reading_pane_default);
		_showFurniture = true;
		_showBackground = true;
		_settingsOpen = false;
		_visible = false;
		_hasMarkup = null;
		_pendingContent = null;
		connectedCallback() {
			super.connectedCallback();
			this.classList.add("pane", "pane-reading");
		}
		render() {
			const bodyClasses = {
				"pane-body": true,
				"show-reading-furniture": this._showFurniture,
				"show-reading-background": this._showBackground
			};
			return b`
      <div class="pane-header">
        <span class="pane-header-title">Reading view</span>
        ${this._visible ? b`<button
              type="button"
              class="pane-settings-toggle"
              aria-expanded=${this._settingsOpen ? "true" : "false"}
              aria-controls="reading-settings"
              @click=${this._onSettingsToggle}
            >
              Layers
            </button>` : A}
      </div>
      <div class="pane-reading-layout">
        <div id="rendered-pane" class=${e$2(bodyClasses)} @click=${this._onBodyClick}>
          ${this._hasMarkup === false ? b`<div class="placeholder">${NO_MARKUP}</div>` : this._hasMarkup === true ? b`<div ${n$1(this._onContentRef)}></div>` : A}
        </div>
        ${this._settingsOpen ? this._renderSettings() : A}
      </div>
    `;
		}
		_onContentRef = (el) => {
			if (el && this._pendingContent) el.replaceChildren(this._pendingContent);
		};
		updated() {
			if (!this._pendingContent) return;
			const wrapper = this.shadowRoot?.querySelector(".pane-body > div");
			if (wrapper && !wrapper.contains(this._pendingContent)) wrapper.replaceChildren(this._pendingContent);
		}
		_renderSettings() {
			return b`
      <div class="viewer-settings-layer">
        <button
          type="button"
          class="viewer-settings-scrim"
          tabindex="-1"
          aria-label="Close layers"
          @click=${this._onSettingsClose}
        ></button>
        <aside
          class="viewer-settings"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reading-settings-title"
        >
          <div class="viewer-settings-header">
            <h2 class="viewer-settings-title" id="reading-settings-title">Layers</h2>
            <button
              type="button"
              class="viewer-settings-close"
              aria-label="Close layers"
              @click=${this._onSettingsClose}
            >
              ×
            </button>
          </div>
          <div class="viewer-settings-body">
            <div
              class="settings-subgroup"
              role="group"
              aria-labelledby="reading-settings-title"
            >
              <label class="settings-option settings-option-sub">
                <input
                  type="checkbox"
                  class="cb-furniture"
                  .checked=${this._showFurniture}
                  @change=${this._onFurnitureChange}
                />
                <span>Furniture</span>
              </label>
              <label class="settings-option settings-option-sub">
                <input
                  type="checkbox"
                  class="cb-background"
                  .checked=${this._showBackground}
                  @change=${this._onBackgroundChange}
                />
                <span>Background</span>
              </label>
            </div>
          </div>
        </aside>
      </div>
    `;
		}
		/** The scrollable content body inside the shadow root. */
		get scrollPane() {
			return this.shadowRoot?.querySelector(".pane-body") ?? null;
		}
		setVisible(visible) {
			this._visible = visible;
			this.hidden = !visible;
			this.requestUpdate();
		}
		setSettingsOpen(open) {
			this._settingsOpen = open;
			this.requestUpdate();
		}
		_applySelection() {
			if (!this.shadowRoot) return;
			for (const el of this.shadowRoot.querySelectorAll(".rendered-el.selected")) el.classList.remove("selected");
			if (!this._selectedId) return;
			const renderedEl = this._findRenderedElement(this._selectedId, this._peerIds);
			if (!renderedEl) return;
			this._revealContext(renderedEl);
			renderedEl.classList.add("selected");
			renderedEl.scrollIntoView({
				block: "nearest",
				behavior: "smooth"
			});
		}
		_renderDocument() {
			const state = this._docState;
			if (!state) {
				this._pendingContent = null;
				this._hasMarkup = null;
				return;
			}
			const segment = state.segments[this._currentPage - 1] ?? [];
			const elementIds = state.elementIds.size ? state.elementIds : assignElementIds(segment);
			state.elementIds = elementIds;
			if (segmentHasMarkup(segment)) {
				this._pendingContent = this._buildRenderedArticle(segment, elementIds);
				this._hasMarkup = true;
			} else {
				this._pendingContent = null;
				this._hasMarkup = false;
			}
			this.requestUpdate();
		}
		_clearDocument() {
			this._pendingContent = null;
			this._hasMarkup = null;
			this.requestUpdate();
		}
		_onSettingsToggle = () => {
			this.dispatchEvent(new CustomEvent("doclang-reading-settings-toggle", {
				bubbles: true,
				composed: true
			}));
		};
		_onSettingsClose = () => {
			this.dispatchEvent(new CustomEvent("doclang-reading-settings-close", {
				bubbles: true,
				composed: true
			}));
		};
		_onFurnitureChange = (e) => {
			this._showFurniture = e.target.checked;
			this.requestUpdate();
			this.dispatchEvent(new CustomEvent("doclang-show-reading-furniture", {
				bubbles: true,
				composed: true,
				detail: { checked: this._showFurniture }
			}));
		};
		_onBackgroundChange = (e) => {
			this._showBackground = e.target.checked;
			this.requestUpdate();
			this.dispatchEvent(new CustomEvent("doclang-show-reading-background", {
				bubbles: true,
				composed: true,
				detail: { checked: this._showBackground }
			}));
		};
		_onBodyClick = (e) => {
			const target = e.target;
			const ghostText = target.closest(".rendered-el-virtual-text");
			const elementId = ghostText?.hasAttribute("data-element-id") ? ghostText.getAttribute("data-element-id") : target.closest(".rendered-el[data-element-id]")?.getAttribute("data-element-id") ?? null;
			if (elementId) this.dispatchEvent(new CustomEvent("doclang-element-select", {
				bubbles: true,
				composed: true,
				detail: { id: elementId }
			}));
		};
		_buildRenderedArticle(segment, elementIds) {
			const assetUrls = this._docState?.assetUrls;
			const intraPageThreads = collectIntraPageThreads(segment);
			const skipElements = /* @__PURE__ */ new Set();
			const mergeGroups = /* @__PURE__ */ new Map();
			for (const [, members] of intraPageThreads) {
				mergeGroups.set(members[0], members);
				for (let i = 1; i < members.length; i += 1) skipElements.add(members[i]);
			}
			const article = document.createElement("article");
			article.className = "rendered-doc";
			for (const el of segment) {
				if (el.nodeType !== Node.ELEMENT_NODE) continue;
				if (localName(el) === "page_break") continue;
				if (skipElements.has(el)) continue;
				const mergeGroup = mergeGroups.get(el);
				const rendered = mergeGroup ? renderMergedIntraPageFragments(mergeGroup, elementIds, assetUrls) : renderBlockElement(el, elementIds, { inline: false }, assetUrls);
				if (rendered) article.appendChild(rendered);
			}
			return article;
		}
		_findRenderedElement(elementId, peerIds) {
			if (!this.shadowRoot) return null;
			const direct = this.shadowRoot.querySelector(`.rendered-el-virtual-text[data-element-id="${elementId}"]`) ?? this.shadowRoot.querySelector(`.rendered-el[data-element-id="${elementId}"]`);
			if (direct) return direct;
			const xmlEl = this._docState?.idToElement?.get(elementId);
			const threadId = xmlEl ? elementThreadId(xmlEl) : null;
			if (!threadId) return null;
			const merged = this.shadowRoot.querySelector(`.rendered-fragment-merged[data-thread-id="${threadId}"]`);
			if (!merged) return null;
			const primaryId = merged.getAttribute("data-element-id");
			if (!primaryId || primaryId === elementId) return merged;
			return peerIds.has(elementId) ? merged : null;
		}
		_revealContext(renderedEl) {
			const pictureContents = renderedEl.closest(".rendered-picture-contents");
			if (pictureContents && !pictureContents.open) pictureContents.open = true;
			this._revealLayer(renderedEl);
		}
		_revealLayer(renderedEl) {
			const layer = renderedEl.getAttribute("data-doclang-layer");
			if (!layer || layer === "body") return;
			if (layer === "furniture" && !this._showFurniture) {
				this._showFurniture = true;
				this.requestUpdate();
				this.dispatchEvent(new CustomEvent("doclang-show-reading-furniture", {
					bubbles: true,
					composed: true,
					detail: { checked: true }
				}));
			} else if (layer === "background" && !this._showBackground) {
				this._showBackground = true;
				this.requestUpdate();
				this.dispatchEvent(new CustomEvent("doclang-show-reading-background", {
					bubbles: true,
					composed: true,
					detail: { checked: true }
				}));
			}
		}
	};
	__decorate([r$2()], DoclangReadingPane.prototype, "_showFurniture", void 0);
	__decorate([r$2()], DoclangReadingPane.prototype, "_showBackground", void 0);
	__decorate([r$2()], DoclangReadingPane.prototype, "_settingsOpen", void 0);
	__decorate([r$2()], DoclangReadingPane.prototype, "_visible", void 0);
	__decorate([r$2()], DoclangReadingPane.prototype, "_hasMarkup", void 0);
	DoclangReadingPane = __decorate([t$2("doclang-reading-pane")], DoclangReadingPane);
	//#endregion
	//#region src/components/empty-state/empty-state.css?inline
	var empty_state_default = ":host {\n  display: contents;\n}\n.empty-state {\n  flex: 1 1 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 0;\n  margin: 1rem;\n  padding: 2rem 1.5rem;\n  border: 2px dashed var(--border);\n  border-radius: 0.75rem;\n  background: var(--placeholder-bg);\n  text-align: center;\n  color: var(--muted);\n}\n.empty-state-inner {\n  max-width: 28rem;\n}\n.empty-state-loading {\n  display: none;\n  flex-direction: column;\n  align-items: center;\n}\n:host(.demo-loading) .empty-state-loading {\n  display: flex;\n}\n:host(.demo-loading) .empty-state-prompt {\n  display: none;\n}\n.loading-spinner {\n  width: 2rem;\n  height: 2rem;\n  margin: 0 auto 1rem;\n  border: 2px solid var(--border);\n  border-top-color: var(--accent);\n  border-radius: 50%;\n  animation: loading-spin 0.7s linear infinite;\n}\n@keyframes loading-spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.empty-state-title {\n  margin: 0 0 0.75rem;\n  font-size: 1.05rem;\n  color: var(--text);\n}\n.empty-state p {\n  margin: 0.5rem 0;\n}\n.empty-state-action {\n  margin: 0 0 0.75rem;\n}\n.text-link {\n  color: var(--accent);\n  text-decoration: underline;\n}\n.text-link:hover {\n  opacity: 0.85;\n}\n.empty-state-meta {\n  font-size: 0.875rem;\n}\ncode {\n  font-family: var(--font-mono);\n}\n";
	//#endregion
	//#region src/components/empty-state/empty-state.ts
	/** <doclang-empty-state> — loading/prompt empty state */
	var DoclangEmptyState = class DoclangEmptyState extends i$3 {
		static styles = r$6(empty_state_default);
		_extensions = [];
		_demoLoading = false;
		render() {
			return b`
      <div class="empty-state">
        <div class="empty-state-inner">
          <div
            class="empty-state-loading"
            role="status"
            aria-live="polite"
            aria-label="Loading demo document"
          >
            <div class="loading-spinner" aria-hidden="true"></div>
            <p class="empty-state-title">Loading demo&#x2026;</p>
            <p class="empty-state-meta">Preparing the sample document</p>
          </div>
          <div class="empty-state-prompt">
            <p class="empty-state-title">Drop a DocLang file here</p>
            <p class="empty-state-meta">
              Supported file types:
              <span class="file-types"
                >${this._extensions.map((ext, i) => b`${i > 0 ? ", " : ""}<code>${ext}</code>`)}</span
              >
            </p>
            <p class="empty-state-action">
              or
              <a
                href="#"
                class="text-link"
                @click=${(e) => {
				e.preventDefault();
				this.dispatchEvent(new CustomEvent("doclang-load-demo", {
					bubbles: true,
					composed: true
				}));
			}}
                >load demo</a
              >
            </p>
          </div>
        </div>
      </div>
    `;
		}
		setFileTypeHints(extensions) {
			this._extensions = extensions;
			this.requestUpdate();
		}
		setDemoLoading(loading) {
			this._demoLoading = loading;
			this.classList.toggle("demo-loading", loading);
		}
	};
	DoclangEmptyState = __decorate([t$2("doclang-empty-state")], DoclangEmptyState);
	//#endregion
	//#region node_modules/lit-html/directives/style-map.js
	/**
	* @license
	* Copyright 2018 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/ var n = "important";
	var i = " !important";
	var o = e$4(class extends i$2 {
		constructor(t) {
			if (super(t), t.type !== t$1.ATTRIBUTE || "style" !== t.name || t.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
		}
		render(t) {
			return Object.keys(t).reduce((e, r) => {
				const s = t[r];
				return null == s ? e : e + `${r = r.includes("-") ? r : r.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${s};`;
			}, "");
		}
		update(e, [r]) {
			const { style: s } = e.element;
			if (void 0 === this.ft) return this.ft = new Set(Object.keys(r)), this.render(r);
			for (const t of this.ft) r[t] ?? (this.ft.delete(t), t.includes("-") ? s.removeProperty(t) : s[t] = null);
			for (const t in r) {
				const e = r[t];
				if (null != e) {
					this.ft.add(t);
					const r = "string" == typeof e && e.endsWith(i);
					t.includes("-") || r ? s.setProperty(t, r ? e.slice(0, -11) : e, r ? n : "") : s[t] = e;
				}
			}
			return E;
		}
	});
	//#endregion
	//#region src/components/viewer/viewer.css?inline
	var viewer_default = "/* -----------------------------------------------------------------------\n   DoclangViewer host — full-page shell\n   ----------------------------------------------------------------------- */\n\n:host {\n  display: flex;\n  flex-direction: column;\n  min-height: 100vh;\n  font-family: var(--font-ui);\n  background: var(--bg);\n  color: var(--text);\n}\n\n:host(.drag-over) {\n  background: color-mix(in srgb, var(--accent) 6%, var(--bg));\n}\n\n:host(.drag-over) doclang-empty-state {\n  border-color: var(--accent);\n  background: color-mix(in srgb, var(--accent) 8%, var(--placeholder-bg));\n}\n\n/* -----------------------------------------------------------------------\n   Header\n   ----------------------------------------------------------------------- */\n\nheader {\n  display: grid;\n  grid-template-columns: 1fr auto 1fr;\n  align-items: center;\n  gap: 1rem;\n  padding: 0.75rem 1rem;\n  border-bottom: 1px solid var(--border);\n  background: var(--panel);\n}\n\n.header-brand {\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n  min-width: 0;\n  grid-column: 1;\n  justify-self: start;\n}\n\nheader h1 {\n  margin: 0;\n  font-size: 1.1rem;\n  font-weight: 600;\n}\n\n.header-center {\n  grid-column: 2;\n  justify-self: center;\n  min-width: 0;\n  text-align: center;\n}\n\n.doc-label {\n  color: var(--muted);\n  font-size: 0.8125rem;\n  font-weight: 400;\n  min-width: 0;\n  max-width: min(40vw, 28rem);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.header-logo-link {\n  display: block;\n  flex-shrink: 0;\n  border-radius: 0.25rem;\n  line-height: 0;\n  text-decoration: none;\n}\n\n.header-logo-link:hover { opacity: 0.8; }\n\n.header-logo {\n  display: block;\n  height: 2.25rem;\n  width: auto;\n}\n\n.header-logo-link:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: 2px;\n}\n\n.toolbar-wrap {\n  grid-column: 3;\n  justify-self: end;\n}\n\n/* -----------------------------------------------------------------------\n   Drop banner\n   ----------------------------------------------------------------------- */\n\n.drop-banner {\n  display: none;\n  margin: 0;\n  padding: 0.35rem 1rem;\n  text-align: center;\n  font-size: 0.8125rem;\n  color: var(--muted);\n  background: color-mix(in srgb, var(--accent) 8%, var(--panel));\n  border-bottom: 1px solid var(--border);\n}\n\n:host(.loaded.drag-over) .drop-banner {\n  display: block;\n}\n\n/* -----------------------------------------------------------------------\n   Empty state\n   ----------------------------------------------------------------------- */\n\n:host(.loaded) doclang-empty-state {\n  display: none;\n}\n\n/* -----------------------------------------------------------------------\n   Pane grid\n   ----------------------------------------------------------------------- */\n\n.main {\n  display: none;\n  flex: 1 1 0;\n  min-height: 0;\n}\n\n:host(.loaded) .main {\n  display: grid;\n}\n\n:host(.loaded) .main.layout-stacked {\n  grid-template-columns: 1fr !important;\n}\n\n:host(.loaded) .main.layout-stacked .pane-splitter {\n  display: none !important;\n}\n\n:host(.loaded) .main.layout-stacked .pane {\n  border-right: none;\n  border-bottom: 1px solid var(--border);\n}\n\n:host(.loaded) .main.layout-stacked .pane-layout-last {\n  border-bottom: none;\n}\n\n:host(.loaded) .main:not(.layout-stacked) {\n  grid-template-rows: minmax(0, 1fr);\n}\n\n:host(.loaded) .main:not(.layout-stacked) .pane {\n  border-right: none;\n}\n\n.pane {\n  display: flex;\n  flex-direction: column;\n  border-right: 1px solid var(--border);\n  min-height: 0;\n  min-width: 0;\n}\n\n.pane[hidden] {\n  display: none !important;\n}\n\n.pane-layout-last {\n  border-right: none;\n}\n\n/* -----------------------------------------------------------------------\n   Pane splitters\n   ----------------------------------------------------------------------- */\n\n.pane-splitter {\n  position: relative;\n  width: 1px;\n  margin: 0 -4px;\n  padding: 0 4px;\n  box-sizing: content-box;\n  cursor: col-resize;\n  touch-action: none;\n  z-index: 2;\n  background: transparent;\n}\n\n.pane-splitter::after {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  left: 4px;\n  width: 1px;\n  background: var(--border);\n  transition: background 0.15s ease, width 0.15s ease;\n}\n\n.pane-splitter:hover::after,\n.pane-splitter:focus-visible::after,\n.pane-splitter.is-dragging::after {\n  width: 3px;\n  background: var(--accent);\n}\n\n.pane-splitter[hidden] {\n  display: none !important;\n}\n\n:host(.pane-drag-active) {\n  cursor: col-resize;\n  user-select: none;\n}\n\n:host(.pane-drag-active) .pane-splitter {\n  cursor: col-resize;\n}\n\n/* -----------------------------------------------------------------------\n   Page-nav visibility\n   ----------------------------------------------------------------------- */\n\n:host(:not(.loaded)) doclang-page-nav,\n:host(.markup-only) doclang-page-nav {\n  display: none !important;\n}\n\n/* -----------------------------------------------------------------------\n   Responsive stacked layout\n   ----------------------------------------------------------------------- */\n\n@media (max-width: 1200px) {\n  :host(.loaded) .main.layout-stacked .pane {\n    border-right: none;\n    border-bottom: 1px solid var(--border);\n  }\n\n  :host(.loaded) .main.layout-stacked .pane-layout-last {\n    border-bottom: none;\n  }\n}\n";
	//#endregion
	//#region src/components/viewer/viewer.ts
	init_dom();
	init_document();
	init_zip();
	var SUPPORTED_FILE_EXTENSIONS = [".dclx", ".dclg"];
	var PAGE_WHEEL_COOLDOWN_MS = 200;
	var PAGE_WHEEL_PIXEL_THRESHOLD = 4;
	var PAGE_WHEEL_GESTURE_MS = 100;
	var LAYOUT_STORAGE_KEY = "doclang-viewer-pane-layout";
	var PANE_MIN_RATIO = .12;
	var PANE_KEYS = [
		"file",
		"page",
		"markup",
		"reading"
	];
	var DEFAULT_PANE_RATIOS = [
		1,
		1,
		1,
		1
	];
	var DEFAULT_USER_PANE_VISIBLE = {
		file: false,
		page: true,
		markup: true,
		reading: true
	};
	var LAYOUT_STACK_BREAKPOINT_PX = 1200;
	var DoclangViewer = class DoclangViewer extends i$3 {
		static styles = r$6(viewer_default);
		_loaded = false;
		_markupOnly = false;
		_hasPageView = false;
		_dragOver = false;
		_paneDragActive = false;
		_demoLoading = false;
		_docLabel = null;
		_pageNum = 1;
		_pageCount = 1;
		_stacked = false;
		_mainGridStyle = {};
		_paneGridCols = /* @__PURE__ */ new Map();
		_paneGridRows = /* @__PURE__ */ new Map();
		_splitterCols = [
			null,
			null,
			null
		];
		_lastPaneKey = null;
		_readingSettingsOpen = false;
		_toolbarOptionsOpen = false;
		_userPaneVisible = { ...DEFAULT_USER_PANE_VISIBLE };
		_docState = null;
		_fileCatalog = [];
		_activeFileIndex = -1;
		_filePaneUserToggled = false;
		_paneRatios = [...DEFAULT_PANE_RATIOS];
		_filePaneWidthPx = null;
		_paneDrag = null;
		_layoutStackQuery = null;
		_demoLoadInProgress = false;
		_prevReadingOrderGlobal = false;
		_wheelPixelAccum = 0;
		_wheelPixelGestureUntil = 0;
		_wheelLastFlipAt = 0;
		_pageNavRef = e();
		_toolbarRef = e();
		_filePaneRef = e();
		_markupPaneRef = e();
		_pageViewPaneRef = e();
		_readingPaneRef = e();
		_emptyStateRef = e();
		_splitterRefs = [
			e(),
			e(),
			e()
		];
		_mainRef = e();
		connectedCallback() {
			super.connectedCallback();
			this._loadLayoutPrefs();
			this._normalizePaneRatios();
			this._initLayoutStackListener();
			this._initDragDrop();
			this._initPageWheelNav();
			this.addEventListener("keydown", this._onGlobalKeydown);
		}
		disconnectedCallback() {
			super.disconnectedCallback();
			this._layoutStackQuery?.removeEventListener("change", this._onLayoutStackChange);
			window.removeEventListener("pointermove", this._onWindowPointerMove);
			window.removeEventListener("pointerup", this._onWindowPointerUp);
			window.removeEventListener("pointercancel", this._onWindowPointerUp);
			this.removeEventListener("keydown", this._onGlobalKeydown);
		}
		firstUpdated() {
			const emptyState = this._emptyStateRef.value;
			if (emptyState) emptyState.setFileTypeHints(SUPPORTED_FILE_EXTENSIONS);
			if (this._demoLoading && emptyState) emptyState.setDemoLoading(true);
			this._syncToolbarPaneCheckboxes();
		}
		render() {
			this._loaded, this._markupOnly, this._dragOver, this._paneDragActive;
			return b`
      <header>
        <div class="header-brand">
          <a
            href="#"
            class="header-logo-link"
            title="Back to start"
            @click=${this._onHomeClick}
          >
            <img src="assets/doclang_v3_sail.svg" alt="DocLang" class="header-logo" />
          </a>
          <h1>DocLang Viewer</h1>
          <doclang-page-nav
            ${n$1(this._pageNavRef)}
            @doclang-prev-page=${() => this._docState && this._goToPage(this._docState.currentPage - 1)}
            @doclang-next-page=${() => this._docState && this._goToPage(this._docState.currentPage + 1)}
            @doclang-go-to-page=${(e) => this._goToPage(e.detail.page)}
          ></doclang-page-nav>
        </div>

        <div class="header-center">
          ${this._docLabel ? b`<span class="doc-label">${this._docLabel}</span>` : A}
        </div>

        <div class="toolbar-wrap">
          <doclang-toolbar
            ${n$1(this._toolbarRef)}
            @doclang-load-demo=${this._onLoadDemo}
            @doclang-open-files=${this._onOpenFiles}
            @doclang-toggle-pane=${this._onTogglePane}
            @doclang-reset-pane-layout=${this._onResetPaneLayout}
          ></doclang-toolbar>
        </div>
      </header>

      <p class="drop-banner">Drop to open another file</p>

      <doclang-empty-state
        ${n$1(this._emptyStateRef)}
        @doclang-load-demo=${this._onLoadDemo}
      ></doclang-empty-state>

      <div
        class=${e$2({
				main: true,
				"layout-stacked": this._stacked
			})}
        style=${o(this._mainGridStyle)}
        ${n$1(this._mainRef)}
      >
        <doclang-file-pane
          ${n$1(this._filePaneRef)}
          style=${this._paneGridStyle("file")}
          @doclang-file-select=${(e) => this._switchToFile(e.detail.index)}
          @doclang-file-close=${(e) => this._closeCatalogFile(e.detail.index)}
          @doclang-file-pane-close-all=${this._onFilePaneCloseAll}
        ></doclang-file-pane>

        <div
          class=${e$2({ "pane-splitter": true })}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Files and Original page panes"
          tabindex="0"
          ?hidden=${this._splitterCols[0] === null}
          style=${this._splitterGridStyle(0)}
          ${n$1(this._splitterRefs[0])}
          @pointerdown=${(e) => this._startPaneDrag(e, 0)}
        ></div>

        <doclang-page-view-pane
          ${n$1(this._pageViewPaneRef)}
          style=${this._paneGridStyle("page")}
          @doclang-element-select=${this._onElementSelect}
          @doclang-navigate-thread=${this._onNavigateThread}
          @doclang-clear-selection=${this._onClearSelection}
          @doclang-page-key-nav=${this._onPageKeyNav}
          @doclang-zoom-change=${this._onZoomChange}
          @doclang-overlay-change=${this._onOverlayChange}
          @doclang-hint=${this._onHint}
          @doclang-hint-hide=${this._onHintHide}
          @doclang-panning-change=${this._onPanningChange}
        ></doclang-page-view-pane>

        <div
          class="pane-splitter"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Original page and DocLang panes"
          tabindex="0"
          ?hidden=${this._splitterCols[1] === null}
          style=${this._splitterGridStyle(1)}
          ${n$1(this._splitterRefs[1])}
          @pointerdown=${(e) => this._startPaneDrag(e, 1)}
        ></div>

        <doclang-markup-pane
          ${n$1(this._markupPaneRef)}
          style=${this._paneGridStyle("markup")}
          @doclang-element-select=${this._onElementSelect}
          @doclang-hint=${this._onHint}
          @doclang-hint-hide=${this._onHintHide}
        ></doclang-markup-pane>

        <div
          class="pane-splitter"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize DocLang and Reading view panes"
          tabindex="0"
          ?hidden=${this._splitterCols[2] === null}
          style=${this._splitterGridStyle(2)}
          ${n$1(this._splitterRefs[2])}
          @pointerdown=${(e) => this._startPaneDrag(e, 2)}
        ></div>

        <doclang-reading-pane
          ${n$1(this._readingPaneRef)}
          style=${this._paneGridStyle("reading")}
          @doclang-element-select=${this._onElementSelect}
          @doclang-reading-settings-toggle=${() => this._setReadingSettingsOpen(!this._readingSettingsOpen)}
          @doclang-reading-settings-close=${() => this._setReadingSettingsOpen(false)}
        ></doclang-reading-pane>
      </div>

      <doclang-cursor-hint></doclang-cursor-hint>
    `;
		}
		updated() {
			this.classList.toggle("loaded", this._loaded);
			this.classList.toggle("markup-only", this._markupOnly);
			this.classList.toggle("drag-over", this._dragOver);
			this.classList.toggle("pane-drag-active", this._paneDragActive);
		}
		_paneGridStyle(key) {
			if (this._stacked) {
				const row = this._paneGridRows.get(key);
				return row !== void 0 ? `grid-row:${row}` : "";
			}
			const col = this._paneGridCols.get(key);
			return col !== void 0 ? `grid-column:${col}` : "";
		}
		_splitterGridStyle(index) {
			const col = this._splitterCols[index];
			if (col === null || this._stacked) return "";
			return `grid-column:${col}`;
		}
		_isPaneAvailable(key) {
			if (key === "file") return this._fileCatalog.length > 0;
			if (key === "page") return Boolean(this._docState?.hasPageView);
			return Boolean(this._docState);
		}
		_isPaneVisible(key) {
			if (!this._isPaneAvailable(key)) return false;
			return Boolean(this._userPaneVisible[key]);
		}
		_visiblePaneKeys() {
			return [...PANE_KEYS].filter((key) => this._isPaneVisible(key));
		}
		_filePaneFitWidthPx() {
			const probe = document.createElement("div");
			probe.style.cssText = "position:absolute;visibility:hidden;width:var(--file-pane-fit-width);";
			(this.shadowRoot ?? document.documentElement).appendChild(probe);
			const px = probe.getBoundingClientRect().width;
			probe.remove();
			return Math.ceil(px) || 108;
		}
		_resolvedFilePaneWidthPx() {
			const fit = this._filePaneFitWidthPx();
			return Math.max(fit, this._filePaneWidthPx ?? fit);
		}
		_contentPaneFrWeights(keys) {
			const contentKeys = keys.filter((k) => k !== "file");
			const weights = contentKeys.map((k) => this._paneRatios[this._paneRatioIndex(k)]);
			const sum = weights.reduce((a, b) => a + b, 0) || contentKeys.length;
			return weights.map((w) => w / sum);
		}
		_paneRatioIndex(key) {
			return PANE_KEYS.indexOf(key);
		}
		_normalizePaneRatios() {
			const sum = this._paneRatios.reduce((a, b) => a + b, 0);
			if (sum <= 0) {
				this._paneRatios = [...DEFAULT_PANE_RATIOS];
				return;
			}
			this._paneRatios = this._paneRatios.map((r) => r / sum);
		}
		_paneKeysAdjacent(leftKey, rightKey) {
			return PANE_KEYS.indexOf(leftKey) >= 0 && PANE_KEYS.indexOf(rightKey) === PANE_KEYS.indexOf(leftKey) + 1;
		}
		_onlyHiddenPanesBetween(leftKey, rightKey) {
			const li = PANE_KEYS.indexOf(leftKey);
			const ri = PANE_KEYS.indexOf(rightKey);
			if (li < 0 || ri <= li) return false;
			for (let i = li + 1; i < ri; i++) if (this._isPaneVisible(PANE_KEYS[i])) return false;
			return true;
		}
		_shouldShowSplitter(leftKey, rightKey) {
			if (!this._isPaneVisible(leftKey) || !this._isPaneVisible(rightKey)) return false;
			if (this._paneKeysAdjacent(leftKey, rightKey)) return true;
			return this._onlyHiddenPanesBetween(leftKey, rightKey);
		}
		_visibleNeighborAfter(key) {
			const idx = PANE_KEYS.indexOf(key);
			for (let i = idx + 1; i < PANE_KEYS.length; i++) if (this._isPaneVisible(PANE_KEYS[i])) return PANE_KEYS[i];
			return null;
		}
		_visibleNeighborBefore(key) {
			const idx = PANE_KEYS.indexOf(key);
			for (let i = idx - 1; i >= 0; i--) if (this._isPaneVisible(PANE_KEYS[i])) return PANE_KEYS[i];
			return null;
		}
		_applyPaneLayout() {
			const stacked = this._loaded && Boolean(this._layoutStackQuery?.matches);
			this._stacked = stacked;
			let keys = this._visiblePaneKeys();
			if (!keys.length) {
				this._userPaneVisible.markup = true;
				keys = this._visiblePaneKeys();
			}
			const gridCols = /* @__PURE__ */ new Map();
			const gridRows = /* @__PURE__ */ new Map();
			const splitterCols = [
				null,
				null,
				null
			];
			if (!this._loaded) {
				this._paneGridCols = gridCols;
				this._paneGridRows = gridRows;
				this._splitterCols = splitterCols;
				this._mainGridStyle = {};
				this._lastPaneKey = null;
				this.requestUpdate();
				return;
			}
			this._lastPaneKey = keys[keys.length - 1] ?? null;
			if (stacked) {
				let row = 1;
				for (const key of keys) gridRows.set(key, row++);
				this._paneGridCols = gridCols;
				this._paneGridRows = gridRows;
				this._splitterCols = splitterCols;
				this._mainGridStyle = {};
				this._pageViewPaneRef.value?.refreshLayout();
				this._readingPaneRef.value?.setVisible(this._isPaneVisible("reading"));
				this.requestUpdate();
				return;
			}
			const contentFr = this._contentPaneFrWeights(keys);
			const cols = [];
			let frIndex = 0;
			keys.forEach((key, i) => {
				if (key === "file") cols.push(`${this._resolvedFilePaneWidthPx()}px`);
				else cols.push(`minmax(0, ${contentFr[frIndex++].toFixed(6)}fr)`);
				if (i < keys.length - 1 && this._shouldShowSplitter(keys[i], keys[i + 1])) cols.push("1px");
			});
			let col = 1;
			keys.forEach((key, i) => {
				gridCols.set(key, col++);
				if (i < keys.length - 1) {
					const lk = keys[i];
					const rk = keys[i + 1];
					if (!this._shouldShowSplitter(lk, rk)) return;
					const physIdx = PANE_KEYS.indexOf(lk);
					if (physIdx >= 0 && physIdx < 3) splitterCols[physIdx] = col++;
				}
			});
			this._paneGridCols = gridCols;
			this._paneGridRows = gridRows;
			this._splitterCols = splitterCols;
			this._mainGridStyle = { gridTemplateColumns: cols.join(" ") };
			this._pageViewPaneRef.value?.refreshLayout();
			this._readingPaneRef.value?.setVisible(this._isPaneVisible("reading"));
			this.requestUpdate();
		}
		_setUserPaneVisible(key, visible) {
			this._userPaneVisible[key] = visible;
			if (key === "file") this._filePaneUserToggled = true;
			if (key === "page") this._syncPagePaneControls();
			if (key === "reading" && !visible) this._setReadingSettingsOpen(false);
			this._syncToolbarPaneCheckboxes();
			this._saveLayoutPrefs();
			this._applyPaneLayout();
		}
		_syncPagePaneControls() {
			this._pageViewPaneRef.value?.setVisible(this._isPaneVisible("page"));
		}
		_loadLayoutPrefs() {
			try {
				const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
				if (!raw) return;
				const data = JSON.parse(raw);
				if (data?.visible && typeof data.visible === "object") {
					for (const key of PANE_KEYS) if (typeof data.visible[key] === "boolean") this._userPaneVisible[key] = data.visible[key];
					if (typeof data.visible["file"] === "boolean") this._filePaneUserToggled = true;
				}
				if (Array.isArray(data?.ratios)) {
					const valid = data.ratios.every((n) => typeof n === "number" && n > 0);
					if (valid && data.ratios.length === 4) {
						this._paneRatios = [...data.ratios];
						this._normalizePaneRatios();
					} else if (valid && data.ratios.length === 3) {
						this._paneRatios = [1, ...data.ratios];
						this._normalizePaneRatios();
					}
				}
				if (typeof data?.filePaneWidthPx === "number" && data.filePaneWidthPx > 0) this._filePaneWidthPx = data.filePaneWidthPx;
			} catch {}
		}
		_saveLayoutPrefs() {
			try {
				localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify({
					visible: this._userPaneVisible,
					ratios: this._paneRatios,
					filePaneWidthPx: this._filePaneWidthPx
				}));
			} catch {}
		}
		_resetPaneLayout() {
			this._filePaneUserToggled = false;
			this._userPaneVisible = {
				file: this._defaultFilePaneVisible(),
				page: true,
				markup: true,
				reading: true
			};
			this._paneRatios = [...DEFAULT_PANE_RATIOS];
			this._normalizePaneRatios();
			this._filePaneWidthPx = null;
			this._setReadingSettingsOpen(false);
			this._syncPagePaneControls();
			this._syncToolbarPaneCheckboxes();
			this._saveLayoutPrefs();
			this._applyPaneLayout();
		}
		_onLayoutStackChange = () => {
			this._applyPaneLayout();
		};
		_initLayoutStackListener() {
			this._layoutStackQuery = window.matchMedia(`(max-width: ${LAYOUT_STACK_BREAKPOINT_PX}px)`);
			this._layoutStackQuery.addEventListener("change", this._onLayoutStackChange);
			this._onLayoutStackChange();
		}
		_contentPaneAvailableWidthPx() {
			const main = this._mainRef.value;
			if (!main) return 1;
			const rect = main.getBoundingClientRect();
			const keys = this._visiblePaneKeys();
			let reserved = 0;
			if (keys.includes("file")) reserved += this._resolvedFilePaneWidthPx();
			for (let i = 0; i < keys.length - 1; i++) if (this._shouldShowSplitter(keys[i], keys[i + 1])) reserved += 1;
			return Math.max(rect.width - reserved, 1);
		}
		_resolvedPhysicalSplitterKeys(physIdx) {
			const leftPhysical = PANE_KEYS[physIdx];
			const rightPhysical = PANE_KEYS[physIdx + 1];
			if (!leftPhysical || !rightPhysical) return null;
			const leftKey = this._isPaneVisible(leftPhysical) ? leftPhysical : this._visibleNeighborBefore(rightPhysical);
			const rightKey = this._isPaneVisible(rightPhysical) ? rightPhysical : this._visibleNeighborAfter(leftPhysical);
			if (!leftKey || !rightKey || leftKey === rightKey) return null;
			if (!this._shouldShowSplitter(leftKey, rightKey)) return null;
			if (PANE_KEYS.indexOf(leftKey) !== physIdx) return null;
			return {
				leftKey,
				rightKey
			};
		}
		_startPaneDrag(e, physIdx) {
			if (e.button !== 0 || this._stacked || !this._loaded) return;
			const resolved = this._resolvedPhysicalSplitterKeys(physIdx);
			if (!resolved) return;
			const { leftKey, rightKey } = resolved;
			this._normalizePaneRatios();
			const leftIndex = this._paneRatioIndex(leftKey);
			const rightIndex = this._paneRatioIndex(rightKey);
			const drag = {
				physicalSplitterIndex: physIdx,
				leftKey,
				rightKey,
				startX: e.clientX,
				leftStart: this._paneRatios[leftIndex],
				rightStart: this._paneRatios[rightIndex],
				pointerId: e.pointerId
			};
			if (leftKey === "file") drag.leftStartPx = this._resolvedFilePaneWidthPx();
			else if (rightKey === "file") drag.rightStartPx = this._resolvedFilePaneWidthPx();
			this._paneDrag = drag;
			e.preventDefault();
			e.currentTarget.setPointerCapture(e.pointerId);
			e.currentTarget.classList.add("is-dragging");
			this._paneDragActive = true;
			this.requestUpdate();
		}
		_onWindowPointerMove = (e) => {
			const drag = this._paneDrag;
			if (!drag || e.pointerId !== drag.pointerId) return;
			if (drag.leftKey === "file" && typeof drag.leftStartPx === "number") {
				this._filePaneWidthPx = Math.max(this._filePaneFitWidthPx(), drag.leftStartPx + (e.clientX - drag.startX));
				this._applyPaneLayout();
				return;
			}
			if (drag.rightKey === "file" && typeof drag.rightStartPx === "number") {
				this._filePaneWidthPx = Math.max(this._filePaneFitWidthPx(), drag.rightStartPx - (e.clientX - drag.startX));
				this._applyPaneLayout();
				return;
			}
			const keys = this._visiblePaneKeys();
			const frWeights = this._contentPaneFrWeights(keys);
			const leftContentIdx = keys.filter((k) => k !== "file").indexOf(drag.leftKey);
			if (leftContentIdx < 0 || leftContentIdx + 1 >= frWeights.length) return;
			const pairFrTotal = frWeights[leftContentIdx] + frWeights[leftContentIdx + 1];
			if (!(pairFrTotal > 0)) return;
			const pairPixels = Math.max(this._contentPaneAvailableWidthPx() * pairFrTotal, 1);
			const deltaRatio = (e.clientX - drag.startX) / pairPixels;
			const leftIdx = this._paneRatioIndex(drag.leftKey);
			const rightIdx = this._paneRatioIndex(drag.rightKey);
			const pairTotal = drag.leftStart + drag.rightStart;
			if (!(pairTotal > 0) || leftIdx < 0 || rightIdx < 0) return;
			const leftMin = Math.min(PANE_MIN_RATIO, pairTotal / 2);
			const rightMin = Math.min(PANE_MIN_RATIO, pairTotal / 2);
			let nextLeft = drag.leftStart + deltaRatio * pairTotal;
			nextLeft = Math.min(Math.max(nextLeft, leftMin), pairTotal - rightMin);
			this._paneRatios[leftIdx] = nextLeft;
			this._paneRatios[rightIdx] = pairTotal - nextLeft;
			this._applyPaneLayout();
		};
		_onWindowPointerUp = (e) => {
			const drag = this._paneDrag;
			if (!drag || e.pointerId !== drag.pointerId) return;
			const splitter = this._splitterRefs[drag.physicalSplitterIndex]?.value;
			splitter?.classList.remove("is-dragging");
			if (splitter?.hasPointerCapture(e.pointerId)) splitter.releasePointerCapture(e.pointerId);
			this._paneDrag = null;
			this._paneDragActive = false;
			this._normalizePaneRatios();
			this._saveLayoutPrefs();
			this.requestUpdate();
		};
		_goToPage(n) {
			const s = this._docState;
			if (!s) return;
			this._pageViewPaneRef.value?.closeSettings();
			const page = Math.min(Math.max(1, n), s.pageCount);
			s.currentPage = page;
			const markupPane = this._markupPaneRef.value;
			const readingPane = this._readingPaneRef.value;
			const pageViewPane = this._pageViewPaneRef.value;
			if (markupPane) markupPane.page = page;
			if (readingPane) readingPane.page = page;
			if (pageViewPane) pageViewPane.page = page;
			this._pageNum = page;
			this.requestUpdate();
			this._pageNavRef.value?.setIndicator(page, s.pageCount);
		}
		_findElementIdOnPage(el) {
			if (!this._docState?.elementIds) return null;
			for (const [node, id] of this._docState.elementIds) if (node === el) return id;
			return null;
		}
		_navigateThreadFragment(elementId, direction) {
			const s = this._docState;
			const el = s?.idToElement?.get(elementId);
			if (!el) return;
			const nav = s?.threadNavByElement?.get(el);
			if (!nav) return;
			const target = direction === "prev" ? nav.prev : nav.next;
			if (!target) return;
			const page = s.elementPageByEl.get(target);
			if (!page) return;
			if (page === s.currentPage) {
				const id = this._findElementIdOnPage(target);
				if (id) this._selectElement(id);
				return;
			}
			s.pendingSelectElement = target;
			this._goToPage(page);
		}
		_findListVirtualTextHost(list, target) {
			const nodes = [...list.childNodes];
			let i = skipContainerLevelHead(nodes, 0);
			while (i < nodes.length) {
				const node = nodes[i];
				if (node.nodeType !== Node.ELEMENT_NODE || localName(node) !== "ldiv") {
					i++;
					continue;
				}
				const ldiv = node;
				i++;
				const end = skipUntilListItemBoundary(nodes, i);
				if (target === ldiv || nodes.slice(i, end).some((n) => xmlContains(target, n))) return ldiv;
				i = end;
			}
			return null;
		}
		_findTableVirtualTextHost(container, target) {
			const nodes = [...container.childNodes];
			let i = skipContainerLevelHead(nodes, 0);
			while (i < nodes.length) {
				const node = nodes[i];
				if (node.nodeType !== Node.ELEMENT_NODE) {
					i++;
					continue;
				}
				const tag = localName(node);
				if (tag === "nl" || isVirtualTextHost(node) || CELL_SPAN_TAGS.has(tag) || !isCellToken(tag)) {
					i++;
					continue;
				}
				const cell = node;
				i++;
				const end = skipUntilCellBoundary(nodes, i);
				if (target === cell || nodes.slice(i, end).some((n) => xmlContains(target, n))) return cell;
				i = end;
			}
			return null;
		}
		_findVirtualTextHost(xmlEl) {
			let node = xmlEl;
			while (node) {
				const parent = node.parentElement;
				if (!parent) return null;
				const tag = localName(parent);
				if (tag === "list") {
					const h = this._findListVirtualTextHost(parent, xmlEl);
					if (h) return h;
				}
				if (OTSL_CONTAINER_TAGS.has(tag)) {
					const h = this._findTableVirtualTextHost(parent, xmlEl);
					if (h) return h;
				}
				node = parent;
			}
			return null;
		}
		_resolveSelectionElement(xmlEl) {
			if (!xmlEl) return null;
			if (isSemanticElement(xmlEl) || isVirtualTextHost(xmlEl)) return xmlEl;
			let node = xmlEl.parentElement;
			while (node) {
				if (localName(node) === "doclang") break;
				if (isSemanticElement(node) && !isListOrOtslContainer(node)) return node;
				node = node.parentElement;
			}
			const virtualHost = this._findVirtualTextHost(xmlEl);
			if (virtualHost) return virtualHost;
			node = xmlEl.parentElement;
			while (node) {
				if (localName(node) === "doclang") break;
				if (isSemanticElement(node) || isVirtualTextHost(node)) return node;
				node = node.parentElement;
			}
			return null;
		}
		_resolveSelectionElementId(rawId) {
			const s = this._docState;
			if (!rawId || !s?.idToElement || !s.elementIds) return null;
			const xmlEl = s.idToElement.get(rawId);
			if (!xmlEl) return null;
			const resolved = this._resolveSelectionElement(xmlEl);
			return resolved ? s.elementIds.get(resolved) ?? null : null;
		}
		_selectElement(elementId) {
			if (!elementId) return;
			const markup = this._markupPaneRef.value;
			const reading = this._readingPaneRef.value;
			const page = this._pageViewPaneRef.value;
			if (markup) markup.selected = elementId;
			if (reading) reading.selected = elementId;
			if (page) page.selected = elementId;
		}
		_clearSelection() {
			const markup = this._markupPaneRef.value;
			const reading = this._readingPaneRef.value;
			const page = this._pageViewPaneRef.value;
			if (markup) markup.selected = null;
			if (reading) reading.selected = null;
			if (page) page.selected = null;
		}
		_setReadingSettingsOpen(open) {
			this._readingSettingsOpen = open;
			this._readingPaneRef.value?.setSettingsOpen(open);
			this.requestUpdate();
		}
		_closeAllSettings() {
			this._pageViewPaneRef.value?.closeSettings();
			this._setReadingSettingsOpen(false);
		}
		_syncToolbarPaneCheckboxes() {
			this._toolbarRef.value?.syncPaneToggles({
				file: this._userPaneVisible.file,
				page: this._userPaneVisible.page,
				markup: this._userPaneVisible.markup,
				reading: this._userPaneVisible.reading,
				fileAvailable: this._isPaneAvailable("file"),
				pageAvailable: this._isPaneAvailable("page"),
				hasState: Boolean(this._docState)
			});
		}
		_setDocumentOpen(open, { markupOnly = false } = {}) {
			this._loaded = open;
			this._markupOnly = open && markupOnly;
			this._pageNavRef.value?.setVisible(open && !markupOnly);
			this._syncToolbarPaneCheckboxes();
			this._applyPaneLayout();
			this.requestUpdate();
		}
		_setPageViewVisible(visible) {
			this._hasPageView = visible;
			this._syncPagePaneControls();
			this._syncToolbarPaneCheckboxes();
			if (!visible) this._pageViewPaneRef.value?.closeSettings();
			this._applyPaneLayout();
		}
		_resetViewer() {
			this._setDemoLoading(false);
			this._clearFileCatalog();
			this._filePaneUserToggled = false;
			this._pageViewPaneRef.value?.resetZoom();
			this._docLabel = null;
			this._setDocumentOpen(false);
			this._hasPageView = false;
			this._closeAllSettings();
			this._toolbarOptionsOpen = false;
			this._toolbarRef.value?.setOptionsOpen(false);
			const markup = this._markupPaneRef.value;
			const reading = this._readingPaneRef.value;
			const pageView = this._pageViewPaneRef.value;
			if (markup) markup.document = null;
			if (reading) reading.document = null;
			if (pageView) pageView.document = null;
			this._filePaneRef.value?.renderFiles([]);
			this._pageNavRef.value?.setIndicator(1, 1);
			this._pageNum = 1;
			this._pageCount = 1;
			this._updateFileView();
			this._applyPaneLayout();
			this.requestUpdate();
		}
		_activateDocument(docState, entry) {
			this._docState = docState;
			this._closeAllSettings();
			this._pageViewPaneRef.value?.activateZoom(entry.pageZoom ?? 100);
			this._docLabel = entry.label;
			this._setDocumentOpen(true, { markupOnly: docState.markupOnly });
			this._setPageViewVisible(docState.hasPageView);
			this._pageNum = docState.currentPage;
			this._pageCount = docState.pageCount;
			this._pageNavRef.value?.setIndicator(docState.currentPage, docState.pageCount);
			const markup = this._markupPaneRef.value;
			const reading = this._readingPaneRef.value;
			const pageView = this._pageViewPaneRef.value;
			if (markup) markup.document = docState;
			if (reading) reading.document = docState;
			if (pageView) pageView.document = docState;
			this._updateFileView();
			this.requestUpdate();
		}
		_pageImageMimeFromExt(ext) {
			const n = ext.toLowerCase().replace("jpeg", "jpg");
			if (n === "png") return "image/png";
			if (n === "webp") return "image/webp";
			return "image/jpeg";
		}
		_createPageImageObjectUrl(data, ext) {
			return URL.createObjectURL(new Blob([data], { type: this._pageImageMimeFromExt(ext) }));
		}
		_createFirstPageImageUrlFromFiles(files) {
			let bestPage = Infinity;
			let bestFile = null;
			for (const f of files) {
				const parts = (f.webkitRelativePath || f.name).split("/");
				if (parts.length < 2 || parts[parts.length - 2] !== "pages") continue;
				const m = PAGE_IMAGE_RE.exec(f.name);
				if (!m) continue;
				const pageNum = Number(m[1]);
				if (pageNum < bestPage) {
					bestPage = pageNum;
					bestFile = f;
				}
			}
			return bestFile ? URL.createObjectURL(bestFile) : null;
		}
		async _createFirstPageImageUrlFromZip(source) {
			const entries = await unzip(source instanceof File ? await source.arrayBuffer() : source, { shouldExtract: (name) => /^pages\/\d+\.(png|jpe?g|webp)$/i.test(name) });
			let bestPage = Infinity;
			let bestEntry = null;
			for (const e of entries) {
				const m = e.name.match(/^pages\/(\d+)\.(png|jpe?g|webp)$/i);
				if (!m) continue;
				const pageNum = Number(m[1]);
				if (pageNum < bestPage) {
					bestPage = pageNum;
					bestEntry = e;
				}
			}
			if (!bestEntry) return null;
			return this._createPageImageObjectUrl(bestEntry.data, bestEntry.name.split(".").pop() ?? "png");
		}
		async _resolveCatalogEntryThumbnail(entry) {
			if (entry.thumbnailUrl) return entry.thumbnailUrl;
			if (entry.kind === "markup") return null;
			try {
				if (entry.kind === "folder") entry.thumbnailUrl = this._createFirstPageImageUrlFromFiles(entry.source);
				else if (entry.kind === "archive") entry.thumbnailUrl = await this._createFirstPageImageUrlFromZip(entry.source);
			} catch {
				entry.thumbnailUrl = null;
			}
			return entry.thumbnailUrl;
		}
		_enrichCatalogEntryThumbnail(entry) {
			this._resolveCatalogEntryThumbnail(entry).then((url) => {
				if (!this._fileCatalog.includes(entry)) {
					if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
					return;
				}
				if (url) this._renderFileView();
			});
		}
		_revokeCatalogEntry(entry) {
			if (entry?.thumbnailUrl?.startsWith("blob:")) URL.revokeObjectURL(entry.thumbnailUrl);
			if (entry) entry.thumbnailUrl = null;
		}
		_createFileCatalogEntry(file) {
			return {
				id: crypto.randomUUID(),
				label: file.name,
				kind: this._isMarkupFile(file) ? "markup" : "archive",
				source: file,
				currentPage: 1,
				pageZoom: 100,
				snapshot: null,
				thumbnailUrl: null
			};
		}
		_isArchiveFile(file) {
			return /\.dclx$/i.test(file.name) || /\.zip$/i.test(file.name);
		}
		_isMarkupFile(file) {
			return /\.(?:dclg(?:\.xml)?|xml)$/i.test(file.name);
		}
		async _parseCatalogEntry(entry) {
			try {
				if (entry.kind === "markup") return buildDocumentState(entry.source instanceof File ? await entry.source.text() : new TextDecoder().decode(entry.source), /* @__PURE__ */ new Map(), entry.label, /* @__PURE__ */ new Map(), { markupOnly: true });
				if (entry.kind === "archive") {
					const { markupXml, pageImages, assetUrls } = await extractArchiveFromZipBuffer(entry.source instanceof File ? await entry.source.arrayBuffer() : entry.source);
					return buildDocumentState(markupXml, pageImages, entry.label, assetUrls, { markupOnly: false });
				}
				if (entry.kind === "folder") {
					const { markupXml, pageImages, assetUrls } = await extractArchiveFromFiles(entry.source);
					return buildDocumentState(markupXml, pageImages, entry.label, assetUrls, { markupOnly: false });
				}
			} catch (err) {
				alert(`Failed to read ${entry.label}: ${err.message}`);
			}
			return null;
		}
		_persistActiveFileViewState() {
			if (this._activeFileIndex < 0 || !this._docState) return;
			const entry = this._fileCatalog[this._activeFileIndex];
			if (!entry) return;
			entry.currentPage = this._docState.currentPage;
			entry.pageZoom = this._pageViewPaneRef.value?.zoomPercent ?? 100;
		}
		_releaseActiveDocument() {
			if (this._activeFileIndex >= 0) {
				const entry = this._fileCatalog[this._activeFileIndex];
				if (entry?.snapshot) {
					revokeDocumentState(entry.snapshot);
					entry.snapshot = null;
				}
			}
			if (this._docState) revokeDocumentState(this._docState);
			this._docState = null;
		}
		_clearFileCatalog() {
			this._releaseActiveDocument();
			for (const entry of this._fileCatalog) this._revokeCatalogEntry(entry);
			this._fileCatalog = [];
			this._activeFileIndex = -1;
		}
		async _switchToFile(index) {
			if (index < 0 || index >= this._fileCatalog.length) return;
			this._persistActiveFileViewState();
			this._releaseActiveDocument();
			this._activeFileIndex = index;
			const entry = this._fileCatalog[index];
			const docState = await this._parseCatalogEntry(entry);
			if (!docState) {
				this._revokeCatalogEntry(entry);
				this._fileCatalog.splice(index, 1);
				this._activeFileIndex = -1;
				if (this._fileCatalog.length) await this._switchToFile(Math.min(index, this._fileCatalog.length - 1));
				else this._resetViewer();
				return;
			}
			entry.snapshot = docState;
			docState.currentPage = entry.currentPage ?? 1;
			this._activateDocument(docState, entry);
		}
		_defaultFilePaneVisible() {
			return this._fileCatalog.length > 1;
		}
		_syncFilePaneDefault() {
			if (!this._filePaneUserToggled) {
				const wasVisible = this._userPaneVisible.file;
				const should = this._defaultFilePaneVisible();
				this._userPaneVisible.file = should;
				if (!wasVisible && should) {
					this._paneRatios = [...DEFAULT_PANE_RATIOS];
					this._normalizePaneRatios();
					this._filePaneWidthPx = null;
				}
			}
		}
		async _closeCatalogFile(index) {
			if (index < 0 || index >= this._fileCatalog.length) return;
			const wasActive = index === this._activeFileIndex;
			const entry = this._fileCatalog[index];
			if (wasActive) {
				this._releaseActiveDocument();
				this._activeFileIndex = -1;
			}
			this._revokeCatalogEntry(entry);
			this._fileCatalog.splice(index, 1);
			if (!this._fileCatalog.length) {
				this._resetViewer();
				return;
			}
			if (wasActive) {
				await this._switchToFile(Math.min(index, this._fileCatalog.length - 1));
				return;
			}
			if (index < this._activeFileIndex) this._activeFileIndex -= 1;
			this._updateFileView();
		}
		_renderFileView() {
			this._filePaneRef.value?.renderFiles(this._fileCatalog.map((entry, index) => ({
				label: entry.label,
				thumbnailUrl: entry.thumbnailUrl,
				isActive: index === this._activeFileIndex
			})));
		}
		_updateFileView() {
			this._syncFilePaneDefault();
			this._renderFileView();
			this._syncToolbarPaneCheckboxes();
			this._applyPaneLayout();
		}
		async _addFilesToCatalog(files, { replace = false } = {}) {
			if (replace) {
				this._clearFileCatalog();
				this._filePaneUserToggled = false;
			}
			const startIndex = this._fileCatalog.length;
			for (const file of files) {
				const entry = this._createFileCatalogEntry(file);
				this._fileCatalog.push(entry);
				this._enrichCatalogEntryThumbnail(entry);
			}
			if (!this._fileCatalog.length) return;
			await this._switchToFile(replace ? 0 : startIndex);
		}
		async _appendFolderArchive(files) {
			if (!files.some((f) => f.name === "document.xml")) {
				alert("Archive must contain document.xml at its root.");
				return;
			}
			const rootName = (files[0].webkitRelativePath || files[0].name).split("/")[0] || "archive";
			const entry = {
				id: crypto.randomUUID(),
				label: rootName,
				kind: "folder",
				source: files,
				currentPage: 1,
				pageZoom: 100,
				snapshot: null,
				thumbnailUrl: null
			};
			this._fileCatalog.push(entry);
			this._enrichCatalogEntryThumbnail(entry);
			await this._switchToFile(this._fileCatalog.length - 1);
		}
		async _addArchiveBufferToCatalog(buffer, label, { replace = false } = {}) {
			if (replace) {
				this._clearFileCatalog();
				this._filePaneUserToggled = false;
			}
			const entry = {
				id: crypto.randomUUID(),
				label,
				kind: "archive",
				source: buffer,
				currentPage: 1,
				pageZoom: 100,
				snapshot: null,
				thumbnailUrl: null
			};
			this._fileCatalog.push(entry);
			this._enrichCatalogEntryThumbnail(entry);
			await this._switchToFile(replace ? 0 : this._fileCatalog.length - 1);
		}
		_setDemoLoading(loading) {
			this._demoLoading = loading;
			this._emptyStateRef.value?.setDemoLoading(loading);
			this._toolbarRef.value?.setDemoLoading(loading);
			this.requestUpdate();
		}
		async _loadDemo() {
			if (this._demoLoadInProgress) return;
			this._demoLoadInProgress = true;
			this._setDemoLoading(true);
			try {
				const demoUrl = globalThis["DEMO_ARCHIVE_URL"];
				if (!demoUrl) throw new Error("DEMO_ARCHIVE_URL not defined");
				const res = await fetch(demoUrl);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const label = demoUrl.split("/").pop() || "demo.dclx";
				await this._addArchiveBufferToCatalog(await res.arrayBuffer(), label, { replace: true });
			} catch (err) {
				alert(`Failed to load demo: ${err.message}\n\nServe this directory over HTTP (e.g. python3 -m http.server) and open the viewer from localhost.`);
			} finally {
				this._demoLoadInProgress = false;
				this._setDemoLoading(false);
			}
		}
		_hasArchiveTransfer(dataTransfer) {
			return Boolean(dataTransfer && [...dataTransfer.types].includes("Files"));
		}
		_initDragDrop() {
			this.addEventListener("dragenter", (e) => {
				if (!this._hasArchiveTransfer(e.dataTransfer)) return;
				e.preventDefault();
				this._dragOver = true;
				this.requestUpdate();
			});
			this.addEventListener("dragover", (e) => {
				if (!this._hasArchiveTransfer(e.dataTransfer)) return;
				e.preventDefault();
				if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
			});
			this.addEventListener("dragleave", (e) => {
				if (!this._hasArchiveTransfer(e.dataTransfer)) return;
				if (e.relatedTarget && this.contains(e.relatedTarget)) return;
				this._dragOver = false;
				this.requestUpdate();
			});
			this.addEventListener("drop", async (e) => {
				if (!this._hasArchiveTransfer(e.dataTransfer)) return;
				e.preventDefault();
				this._dragOver = false;
				this.requestUpdate();
				if (e.dataTransfer) await this._loadFromDrop(e.dataTransfer);
			});
		}
		async _loadFromDrop(dataTransfer) {
			const files = [...dataTransfer.files];
			if (files.some((f) => f.name === "document.xml")) {
				await this._appendFolderArchive(files);
				return;
			}
			const supported = files.filter((f) => this._isArchiveFile(f) || this._isMarkupFile(f));
			if (supported.length) await this._addFilesToCatalog(supported, { replace: false });
		}
		_wheelDir(e) {
			if (e.deltaMode === 1) return e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
			if (e.deltaMode === 2) return Math.sign(e.deltaY);
			const now = performance.now();
			if (now > this._wheelPixelGestureUntil) this._wheelPixelAccum = 0;
			this._wheelPixelGestureUntil = now + PAGE_WHEEL_GESTURE_MS;
			this._wheelPixelAccum += e.deltaY;
			if (Math.abs(this._wheelPixelAccum) >= PAGE_WHEEL_PIXEL_THRESHOLD) {
				const dir = this._wheelPixelAccum > 0 ? 1 : -1;
				this._wheelPixelAccum = 0;
				return dir;
			}
			return 0;
		}
		_tryFlipPage(dir) {
			const s = this._docState;
			if (!dir || !s) return false;
			const now = performance.now();
			if (now - this._wheelLastFlipAt < PAGE_WHEEL_COOLDOWN_MS) return false;
			const before = s.currentPage;
			this._goToPage(s.currentPage + dir);
			if (s.currentPage !== before) {
				this._wheelLastFlipAt = now;
				return true;
			}
			return false;
		}
		_onScrollPaneWheel(e, pane) {
			const s = this._docState;
			if (!s || s.markupOnly || s.pageCount <= 1) return;
			const dir = this._wheelDir(e);
			if (!dir) return;
			const atTop = pane.scrollTop <= 0;
			const atBottom = pane.scrollTop + pane.clientHeight >= pane.scrollHeight - 1;
			if (!(dir < 0 && atTop) && !(dir > 0 && atBottom)) return;
			e.preventDefault();
			if (!this._tryFlipPage(dir)) return;
			requestAnimationFrame(() => {
				pane.scrollTop = dir > 0 ? 0 : pane.scrollHeight;
			});
		}
		_initPageWheelNav() {
			window.addEventListener("pointermove", this._onWindowPointerMove);
			window.addEventListener("pointerup", this._onWindowPointerUp);
			window.addEventListener("pointercancel", this._onWindowPointerUp);
			this.updateComplete.then(() => {
				const pageViewPane = this._pageViewPaneRef.value;
				if (pageViewPane) pageViewPane.addEventListener("wheel", (e) => {
					if (!this._docState?.hasPageView) return;
					const scrollPane = pageViewPane.scrollPane ?? null;
					if (!scrollPane) return;
					if (scrollPane.scrollHeight > scrollPane.clientHeight || scrollPane.scrollWidth > scrollPane.clientWidth) {
						this._onScrollPaneWheel(e, scrollPane);
						return;
					}
					e.preventDefault();
					const dir = this._wheelDir(e);
					if (dir) this._tryFlipPage(dir);
				}, { passive: false });
				for (const ref of [this._markupPaneRef, this._readingPaneRef]) {
					const pane = ref.value;
					if (!pane) continue;
					pane.addEventListener("wheel", (e) => {
						const scrollPane = pane.scrollPane ?? null;
						if (!scrollPane) return;
						this._onScrollPaneWheel(e, scrollPane);
					}, { passive: false });
				}
			});
		}
		_onHomeClick = (e) => {
			e.preventDefault();
			this._resetViewer();
		};
		_onLoadDemo = () => {
			this._loadDemo();
		};
		_onOpenFiles = (e) => {
			const files = e.detail.files.filter((f) => this._isArchiveFile(f) || this._isMarkupFile(f));
			if (!files.length) return;
			this._addFilesToCatalog(files, { replace: true });
		};
		_onTogglePane = (e) => {
			const { pane, checked } = e.detail;
			if (!this._docState) {
				this._syncToolbarPaneCheckboxes();
				return;
			}
			if (![...PANE_KEYS].filter((k) => k === pane ? checked : this._userPaneVisible[k] && this._isPaneAvailable(k)).length) {
				this._syncToolbarPaneCheckboxes();
				return;
			}
			this._setUserPaneVisible(pane, checked);
		};
		_onResetPaneLayout = () => {
			if (this._docState) this._resetPaneLayout();
		};
		_onFilePaneCloseAll = () => {
			const count = this._fileCatalog.length;
			if (!count) return;
			const msg = count === 1 ? `Remove "${this._fileCatalog[0].label}" from the viewer?` : `Remove all ${count} open files from the viewer?`;
			if (confirm(msg)) this._resetViewer();
		};
		_onElementSelect = (e) => {
			const rawId = e.detail.id;
			const resolved = this._resolveSelectionElementId(rawId) ?? rawId;
			this._selectElement(resolved);
		};
		_onNavigateThread = (e) => {
			const { elementId, direction } = e.detail;
			this._navigateThreadFragment(elementId, direction);
		};
		_onClearSelection = () => {
			this._clearSelection();
		};
		_onPageKeyNav = (e) => {
			const { dir } = e.detail;
			if (this._docState) this._goToPage(this._docState.currentPage + dir);
		};
		_onZoomChange = () => {
			this._pageViewPaneRef.value?.refreshLayout();
		};
		_onOverlayChange = (e) => {
			const detail = e.detail;
			if (detail.readingOrderGlobal !== this._prevReadingOrderGlobal) {
				this._prevReadingOrderGlobal = detail.readingOrderGlobal;
				const s = this._docState;
				if (s) {
					const markup = this._markupPaneRef.value;
					const reading = this._readingPaneRef.value;
					const pageView = this._pageViewPaneRef.value;
					if (markup) markup.document = s;
					if (reading) reading.document = s;
					if (pageView) pageView.document = s;
				}
			}
		};
		_onHint = (e) => {
			const hint = this.shadowRoot?.querySelector("doclang-cursor-hint");
			if (!hint) return;
			const detail = e.detail;
			if (detail.html !== void 0) hint.showHtml(detail.html, detail.clientX, detail.clientY);
			else if (detail.text !== void 0) hint.show(detail.text, detail.clientX, detail.clientY);
		};
		_onHintHide = () => {
			(this.shadowRoot?.querySelector("doclang-cursor-hint"))?.hide();
		};
		_onPanningChange = () => {};
		_onGlobalKeydown = (e) => {
			if (e.key !== "Escape") return;
			if (this._toolbarOptionsOpen) {
				this._toolbarOptionsOpen = false;
				this._toolbarRef.value?.setOptionsOpen(false);
				this.requestUpdate();
			} else this._pageViewPaneRef.value?.closeSettings();
			if (this._readingSettingsOpen) this._setReadingSettingsOpen(false);
		};
		/** Trigger demo load on startup — called by main.ts when DEMO_ARCHIVE_URL is defined. */
		loadDemoOnBoot() {
			this._loadDemo();
		}
		/** Called by main.ts when body has demo-loading class set from HTML. */
		setInitialDemoLoading() {
			this._demoLoading = true;
			this.requestUpdate();
		}
	};
	__decorate([r$2()], DoclangViewer.prototype, "_loaded", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_markupOnly", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_hasPageView", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_dragOver", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_paneDragActive", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_demoLoading", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_docLabel", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_pageNum", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_pageCount", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_stacked", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_mainGridStyle", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_paneGridCols", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_paneGridRows", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_splitterCols", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_lastPaneKey", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_readingSettingsOpen", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_toolbarOptionsOpen", void 0);
	__decorate([r$2()], DoclangViewer.prototype, "_userPaneVisible", void 0);
	DoclangViewer = __decorate([t$2("doclang-viewer")], DoclangViewer);
	//#endregion
	//#region src/main.ts
	var viewer = document.querySelector("doclang-viewer");
	if (viewer) {
		if (globalThis["DEMO_ARCHIVE_URL"]) {
			if (viewer.classList.contains("demo-loading")) viewer.setInitialDemoLoading();
			viewer.loadDemoOnBoot();
		}
	}
	//#endregion
})();

//#region \0rolldown/runtime.js
var e = Object.defineProperty, t = (t, n) => {
	let r = {};
	for (var i in t) e(r, i, {
		get: t[i],
		enumerable: !0
	});
	return n || e(r, Symbol.toStringTag, { value: "Module" }), r;
}, n = globalThis, r = n.ShadowRoot && (n.ShadyCSS === void 0 || n.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, i = Symbol(), a = /* @__PURE__ */ new WeakMap(), o = class {
	constructor(e, t, n) {
		if (this._$cssResult$ = !0, n !== i) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, t = this.t;
		if (r && e === void 0) {
			let n = t !== void 0 && t.length === 1;
			n && (e = a.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), n && a.set(t, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, s = (e) => new o(typeof e == "string" ? e : e + "", void 0, i), c = (e, t) => {
	if (r) e.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let r of t) {
		let t = document.createElement("style"), i = n.litNonce;
		i !== void 0 && t.setAttribute("nonce", i), t.textContent = r.cssText, e.appendChild(t);
	}
}, l = r ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return s(t);
})(e) : e, { is: u, defineProperty: d, getOwnPropertyDescriptor: f, getOwnPropertyNames: p, getOwnPropertySymbols: m, getPrototypeOf: ee } = Object, h = globalThis, g = h.trustedTypes, te = g ? g.emptyScript : "", ne = h.reactiveElementPolyfillSupport, re = (e, t) => e, ie = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? te : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, ae = (e, t) => !u(e, t), oe = {
	attribute: !0,
	type: String,
	converter: ie,
	reflect: !1,
	useDefault: !1,
	hasChanged: ae
};
Symbol.metadata ??= Symbol("metadata"), h.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var se = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = oe) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && d(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = f(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? oe;
	}
	static _$Ei() {
		if (this.hasOwnProperty(re("elementProperties"))) return;
		let e = ee(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(re("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(re("properties"))) {
			let e = this.properties, t = [...p(e), ...m(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(l(e));
		} else e !== void 0 && t.push(l(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return c(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? ie : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? ie : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? ae)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
se.elementStyles = [], se.shadowRootOptions = { mode: "open" }, se[re("elementProperties")] = /* @__PURE__ */ new Map(), se[re("finalized")] = /* @__PURE__ */ new Map(), ne?.({ ReactiveElement: se }), (h.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/lit-html/lit-html.js
var ce = globalThis, le = (e) => e, ue = ce.trustedTypes, de = ue ? ue.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, fe = "$lit$", _ = `lit$${Math.random().toFixed(9).slice(2)}$`, pe = "?" + _, me = `<${pe}>`, v = document, he = () => v.createComment(""), ge = (e) => e === null || typeof e != "object" && typeof e != "function", _e = Array.isArray, ve = (e) => _e(e) || typeof e?.[Symbol.iterator] == "function", ye = "[ 	\n\f\r]", be = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, xe = /-->/g, Se = />/g, y = RegExp(`>|${ye}(?:([^\\s"'>=/]+)(${ye}*=${ye}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), Ce = /'/g, we = /"/g, Te = /^(?:script|style|textarea|title)$/i, Ee = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), b = Ee(1), x = Ee(2), S = Symbol.for("lit-noChange"), C = Symbol.for("lit-nothing"), De = /* @__PURE__ */ new WeakMap(), w = v.createTreeWalker(v, 129);
function Oe(e, t) {
	if (!_e(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return de === void 0 ? t : de.createHTML(t);
}
var ke = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = be;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === be ? c[1] === "!--" ? o = xe : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = y) : (Te.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = y) : o = Se : o === y ? c[0] === ">" ? (o = i ?? be, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? y : c[3] === "\"" ? we : Ce) : o === we || o === Ce ? o = y : o === xe || o === Se ? o = be : (o = y, i = void 0);
		let d = o === y && e[t + 1].startsWith("/>") ? " " : "";
		a += o === be ? n + me : l >= 0 ? (r.push(s), n.slice(0, l) + fe + n.slice(l) + _ + d) : n + _ + (l === -2 ? t : d);
	}
	return [Oe(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, Ae = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = ke(t, n);
		if (this.el = e.createElement(l, r), w.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = w.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(fe)) {
					let t = u[o++], n = i.getAttribute(e).split(_), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Fe : r[1] === "?" ? Ie : r[1] === "@" ? Le : Pe
					}), i.removeAttribute(e);
				} else e.startsWith(_) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (Te.test(i.tagName)) {
					let e = i.textContent.split(_), t = e.length - 1;
					if (t > 0) {
						i.textContent = ue ? ue.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], he()), w.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], he());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === pe) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(_, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += _.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = v.createElement("template");
		return n.innerHTML = e, n;
	}
};
function je(e, t, n = e, r) {
	if (t === S) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = ge(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = je(e, i._$AS(e, t.values), i, r)), t;
}
var Me = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? v).importNode(t, !0);
		w.currentNode = r;
		let i = w.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new Ne(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Re(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = w.nextNode(), a++);
		}
		return w.currentNode = v, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, Ne = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = C, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = je(this, e, t), ge(e) ? e === C || e == null || e === "" ? (this._$AH !== C && this._$AR(), this._$AH = C) : e !== this._$AH && e !== S && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? ve(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== C && ge(this._$AH) ? this._$AA.nextSibling.data = e : this.T(v.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = Ae.createElement(Oe(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new Me(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = De.get(e.strings);
		return t === void 0 && De.set(e.strings, t = new Ae(e)), t;
	}
	k(t) {
		_e(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(he()), this.O(he()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = le(e).nextSibling;
			le(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, Pe = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = C, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = C;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = je(this, e, t, 0), a = !ge(e) || e !== this._$AH && e !== S, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = je(this, r[n + o], t, o), s === S && (s = this._$AH[o]), a ||= !ge(s) || s !== this._$AH[o], s === C ? e = C : e !== C && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === C ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Fe = class extends Pe {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === C ? void 0 : e;
	}
}, Ie = class extends Pe {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== C);
	}
}, Le = class extends Pe {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = je(this, e, t, 0) ?? C) === S) return;
		let n = this._$AH, r = e === C && n !== C || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== C && (n === C || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Re = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		je(this, e);
	}
}, ze = {
	M: fe,
	P: _,
	A: pe,
	C: 1,
	L: ke,
	R: Me,
	D: ve,
	V: je,
	I: Ne,
	H: Pe,
	N: Ie,
	U: Le,
	B: Fe,
	F: Re
}, Be = ce.litHtmlPolyfillSupport;
Be?.(Ae, Ne), (ce.litHtmlVersions ??= []).push("3.3.3");
var Ve = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new Ne(t.insertBefore(he(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, He = globalThis, T = class extends se {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ve(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return S;
	}
};
T._$litElement$ = !0, T.finalized = !0, He.litElementHydrateSupport?.({ LitElement: T });
var Ue = He.litElementPolyfillSupport;
Ue?.({ LitElement: T }), (He.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region node_modules/@lit/reactive-element/decorators/custom-element.js
var E = (e) => (t, n) => {
	n === void 0 ? customElements.define(e, t) : n.addInitializer(() => {
		customElements.define(e, t);
	});
}, We = {
	attribute: !0,
	type: String,
	converter: ie,
	reflect: !1,
	hasChanged: ae
}, Ge = (e = We, t, n) => {
	let { kind: r, metadata: i } = n, a = globalThis.litPropertyMetadata.get(i);
	if (a === void 0 && globalThis.litPropertyMetadata.set(i, a = /* @__PURE__ */ new Map()), r === "setter" && ((e = Object.create(e)).wrapped = !0), a.set(n.name, e), r === "accessor") {
		let { name: r } = n;
		return {
			set(n) {
				let i = t.get.call(this);
				t.set.call(this, n), this.requestUpdate(r, i, e, !0, n);
			},
			init(t) {
				return t !== void 0 && this.C(r, void 0, e, t), t;
			}
		};
	}
	if (r === "setter") {
		let { name: r } = n;
		return function(n) {
			let i = this[r];
			t.call(this, n), this.requestUpdate(r, i, e, !0, n);
		};
	}
	throw Error("Unsupported decorator location: " + r);
};
function D(e) {
	return (t, n) => typeof n == "object" ? Ge(e, t, n) : ((e, t, n) => {
		let r = t.hasOwnProperty(n);
		return t.constructor.createProperty(n, e), r ? Object.getOwnPropertyDescriptor(t, n) : void 0;
	})(e, t, n);
}
//#endregion
//#region node_modules/@lit/reactive-element/decorators/state.js
function O(e) {
	return D({
		...e,
		state: !0,
		attribute: !1
	});
}
//#endregion
//#region node_modules/lit-html/directive-helpers.js
var { I: Ke } = ze, qe = (e) => e, Je = (e) => e.strings === void 0, Ye = () => document.createComment(""), Xe = (e, t, n) => {
	let r = e._$AA.parentNode, i = t === void 0 ? e._$AB : t._$AA;
	if (n === void 0) n = new Ke(r.insertBefore(Ye(), i), r.insertBefore(Ye(), i), e, e.options);
	else {
		let t = n._$AB.nextSibling, a = n._$AM, o = a !== e;
		if (o) {
			let t;
			n._$AQ?.(e), n._$AM = e, n._$AP !== void 0 && (t = e._$AU) !== a._$AU && n._$AP(t);
		}
		if (t !== i || o) {
			let e = n._$AA;
			for (; e !== t;) {
				let t = qe(e).nextSibling;
				qe(r).insertBefore(e, i), e = t;
			}
		}
	}
	return n;
}, k = (e, t, n = e) => (e._$AI(t, n), e), Ze = {}, Qe = (e, t = Ze) => e._$AH = t, $e = (e) => e._$AH, et = (e) => {
	e._$AR(), e._$AA.remove();
}, tt = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, nt = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), rt = class {
	constructor(e) {}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AT(e, t, n) {
		this._$Ct = e, this._$AM = t, this._$Ci = n;
	}
	_$AS(e, t) {
		return this.update(e, t);
	}
	update(e, t) {
		return this.render(...t);
	}
}, it = (e, t) => {
	let n = e._$AN;
	if (n === void 0) return !1;
	for (let e of n) e._$AO?.(t, !1), it(e, t);
	return !0;
}, at = (e) => {
	let t, n;
	do {
		if ((t = e._$AM) === void 0) break;
		n = t._$AN, n.delete(e), e = t;
	} while (n?.size === 0);
}, ot = (e) => {
	for (let t; t = e._$AM; e = t) {
		let n = t._$AN;
		if (n === void 0) t._$AN = n = /* @__PURE__ */ new Set();
		else if (n.has(e)) break;
		n.add(e), lt(t);
	}
};
function st(e) {
	this._$AN === void 0 ? this._$AM = e : (at(this), this._$AM = e, ot(this));
}
function ct(e, t = !1, n = 0) {
	let r = this._$AH, i = this._$AN;
	if (i !== void 0 && i.size !== 0) {
		if (t) {
			if (Array.isArray(r)) for (let e = n; e < r.length; e++) it(r[e], !1), at(r[e]);
			else r != null && (it(r, !1), at(r));
		} else it(this, e);
	}
}
var lt = (e) => {
	e.type == tt.CHILD && (e._$AP ??= ct, e._$AQ ??= st);
}, ut = class extends rt {
	constructor() {
		super(...arguments), this._$AN = void 0;
	}
	_$AT(e, t, n) {
		super._$AT(e, t, n), ot(this), this.isConnected = e._$AU;
	}
	_$AO(e, t = !0) {
		e !== this.isConnected && (this.isConnected = e, e ? this.reconnected?.() : this.disconnected?.()), t && (it(this, e), at(this));
	}
	setValue(e) {
		if (Je(this._$Ct)) this._$Ct._$AI(e, this);
		else {
			let t = [...this._$Ct._$AH];
			t[this._$Ci] = e, this._$Ct._$AI(t, this, 0);
		}
	}
	disconnected() {}
	reconnected() {}
}, A = () => new dt(), dt = class {}, ft = /* @__PURE__ */ new WeakMap(), j = nt(class extends ut {
	render(e) {
		return C;
	}
	update(e, [t]) {
		let n = t !== this.G;
		return n && this.rt(void 0), (n || this.lt !== this.ct) && (this.G = t, this.ht = e.options?.host, this.rt(this.ct = e.element)), C;
	}
	rt(e) {
		if (this.G !== void 0) {
			if (this.isConnected || (e = void 0), typeof this.G == "function") {
				let t = this.ht ?? globalThis, n = ft.get(t);
				n === void 0 && (n = /* @__PURE__ */ new WeakMap(), ft.set(t, n)), n.get(this.G) !== void 0 && this.G.call(this.ht, void 0), n.set(this.G, e), e !== void 0 && this.G.call(this.ht, e);
			} else this.G.value = e;
		}
	}
	get lt() {
		return typeof this.G == "function" ? ft.get(this.ht ?? globalThis)?.get(this.G) : this.G?.value;
	}
	disconnected() {
		this.lt === this.ct && this.rt(void 0);
	}
	reconnected() {
		this.rt(this.ct);
	}
}), pt = ":host{--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark;--bg:var(--doclang-bg,#f4f4f5);--panel:var(--doclang-panel,#fff);--border:var(--doclang-border,#d4d4d8);--text:var(--doclang-text,#18181b);--muted:var(--doclang-muted,#71717a);--accent:var(--doclang-accent,#2563eb);--placeholder-bg:var(--doclang-placeholder-bg,#fafafa);--font-ui:var(--doclang-font-ui,system-ui, -apple-system, \"Segoe UI\", sans-serif);--font-mono:var(--doclang-font-mono,ui-monospace, \"Cascadia Code\", \"Source Code Pro\", monospace);--markup-bg:var(--doclang-markup-bg,#fff);--markup-fg:var(--doclang-markup-fg,#24292e);--markup-hover:var(--doclang-markup-hover,#2563eb14);--markup-selected:var(--doclang-markup-selected,#2563eb24);--kind-text:var(--doclang-kind-text,#2563eb);--kind-heading:var(--doclang-kind-heading,#7c3aed);--kind-list:var(--doclang-kind-list,#ea580c);--kind-ldiv:var(--doclang-kind-ldiv,#ea580c);--kind-table:var(--doclang-kind-table,#16a34a);--kind-index:var(--doclang-kind-index,#0d9488);--kind-formula:var(--doclang-kind-formula,#0891b2);--kind-code:var(--doclang-kind-code,#475569);--kind-picture:var(--doclang-kind-picture,#db2777);--kind-group:var(--doclang-kind-group,#4f46e5);--kind-footnote:var(--doclang-kind-footnote,#a16207);--kind-page_header:var(--doclang-kind-page_header,#71717a);--kind-page_footer:var(--doclang-kind-page_footer,#71717a);--kind-caption:var(--doclang-kind-caption,#71717a);--kind-field:var(--doclang-kind-field,#d97706);--kind-default:var(--doclang-kind-default,#dc2626)}@media (prefers-color-scheme:dark){:host{--lightningcss-light: ;--lightningcss-dark:initial;--bg:var(--doclang-bg,#09090b);--panel:var(--doclang-panel,#18181b);--border:var(--doclang-border,#3f3f46);--text:var(--doclang-text,#fafafa);--muted:var(--doclang-muted,#a1a1aa);--placeholder-bg:var(--doclang-placeholder-bg,#27272a);--markup-bg:var(--doclang-markup-bg,#1e1e1e);--markup-fg:var(--doclang-markup-fg,#d4d4d4);--markup-hover:var(--doclang-markup-hover,#60a5fa1a);--markup-selected:var(--doclang-markup-selected,#60a5fa2e);--kind-text:var(--doclang-kind-text,#60a5fa);--kind-heading:var(--doclang-kind-heading,#a78bfa);--kind-list:var(--doclang-kind-list,#fb923c);--kind-ldiv:var(--doclang-kind-ldiv,#fb923c);--kind-table:var(--doclang-kind-table,#4ade80);--kind-index:var(--doclang-kind-index,#2dd4bf);--kind-formula:var(--doclang-kind-formula,#22d3ee);--kind-code:var(--doclang-kind-code,#94a3b8);--kind-picture:var(--doclang-kind-picture,#f472b6);--kind-group:var(--doclang-kind-group,#818cf8);--kind-footnote:var(--doclang-kind-footnote,#facc15);--kind-page_header:var(--doclang-kind-page_header,#a1a1aa);--kind-page_footer:var(--doclang-kind-page_footer,#a1a1aa);--kind-caption:var(--doclang-kind-caption,#a1a1aa);--kind-field:var(--doclang-kind-field,#fbbf24);--kind-default:var(--doclang-kind-default,#f87171)}}:host{display:contents}nav{align-items:center;gap:.75rem;margin-left:.25rem;display:flex}nav:before{content:\"\";background:var(--border);flex-shrink:0;align-self:center;width:1px;height:1.125rem;margin-right:.75rem}nav[hidden]{display:none}.page-nav-btns{align-items:center;gap:.25rem;display:inline-flex}.page-nav-btn{appearance:none;border:1px solid var(--border);background:var(--panel);width:1.875rem;height:1.875rem;color:var(--text);font:inherit;cursor:pointer;border-radius:.375rem;flex-shrink:0;justify-content:center;align-items:center;padding:0;font-size:.875rem;display:inline-flex}.page-nav-btn:hover{border-color:var(--accent)}.page-nav-btn:disabled{opacity:.45;cursor:not-allowed}.page-nav-chevron{width:.875rem;height:.875rem;display:block}.page-indicator{color:var(--muted);font-variant-numeric:tabular-nums;align-items:center;font-size:.875rem;display:inline-flex}.page-number-input{appearance:none;border:1px solid var(--border);background:var(--panel);color:var(--text);font:inherit;font-variant-numeric:tabular-nums;text-align:center;box-sizing:border-box;height:1.875rem;width:calc(var(--doclang-page-num-digits,1) * 1ch + .75rem);cursor:text;border-radius:.375rem;margin:0;padding:0 .35rem;font-size:.875rem;line-height:1}.page-number-input:hover:not(:disabled){border-color:var(--accent)}.page-number-input:focus{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb, var(--accent) 22%, transparent);outline:none}.page-number-input:disabled{opacity:.55;cursor:not-allowed}", M = /* @__PURE__ */ new Set([
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
]), mt = /* @__PURE__ */ new Set([
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
]), ht = /* @__PURE__ */ new Set([
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
]), gt = /* @__PURE__ */ new Set([
	"fcel",
	"ecel",
	"ched",
	"rhed",
	"corn",
	"srow"
]), _t = /* @__PURE__ */ new Set([
	"lcel",
	"ucel",
	"xcel"
]), N = /* @__PURE__ */ new Set([
	"table",
	"index",
	"tabular"
]);
function P(e) {
	return e.nodeType === Node.TEXT_NODE || e.nodeType === Node.CDATA_SECTION_NODE;
}
function F(e) {
	return P(e) && !e.textContent?.trim();
}
function vt(e) {
	return [...e.attributes].filter((e) => e.name !== "xmlns" || e.value !== "https://www.doclang.ai/ns/v0").map((e) => ({
		name: e.name,
		value: e.value
	}));
}
function I(e) {
	return [...e.children];
}
function L(e) {
	return e.localName || e.tagName.replace(/^.*:/, "");
}
function yt(e) {
	return R([...e.childNodes], 0)?.locs ?? [];
}
function R(e, t) {
	let n = [], r = t;
	for (; r < e.length;) {
		let t = e[r];
		if (!t) {
			r += 1;
			continue;
		}
		if (t.nodeType !== Node.ELEMENT_NODE) {
			r += 1;
			continue;
		}
		let i = L(t);
		if (i === "location") {
			if (n.push(t), r += 1, n.length === 4) return {
				locs: n,
				nextIndex: r
			};
			continue;
		}
		if (n.length) break;
		if (M.has(i)) {
			r += 1;
			continue;
		}
		break;
	}
	return n.length === 4 ? {
		locs: n,
		nextIndex: r
	} : null;
}
function z(e, t) {
	for (let n = 0; n < e.length; n += 1) {
		let r = e[n];
		!r || r.nodeType !== Node.ELEMENT_NODE || (t(r), z(I(r), t));
	}
}
function B(e) {
	return ht.has(e);
}
function bt(e) {
	let t = L(e);
	return t === "list" || N.has(t);
}
function xt(e, t) {
	let n = t;
	for (; n < e.length;) {
		let t = e[n];
		if (!t) {
			n += 1;
			continue;
		}
		if (t.nodeType !== Node.ELEMENT_NODE) {
			n += 1;
			continue;
		}
		let r = L(t);
		if (r === "ldiv" || B(r)) break;
		if (M.has(r) || r === "location") {
			n += 1;
			continue;
		}
		break;
	}
	return n;
}
function St(e, t) {
	let n = t;
	for (; n < e.length;) {
		let t = e[n];
		if (t && t.nodeType === Node.ELEMENT_NODE && L(t) === "ldiv") break;
		n += 1;
	}
	return n;
}
function Ct(e, t) {
	let n = t;
	for (; n < e.length;) {
		let t = e[n];
		if (t && t.nodeType === Node.ELEMENT_NODE && B(L(t))) break;
		n += 1;
	}
	return n;
}
function wt(e, t) {
	let n = parseInt(e.getAttribute("resolution") ?? String(t), 10);
	return Number.isFinite(n) && n > 0 ? n : t;
}
function Tt(e) {
	return Math.min(Math.max(parseInt(e.getAttribute("level") ?? "1", 10) || 1, 1), 6);
}
function V(e, t) {
	return I(e).find((e) => L(e) === t) ?? null;
}
function Et(e, t) {
	let n = e;
	for (; n;) {
		if (n === t) return !0;
		n = n.parentNode;
	}
	return !1;
}
function Dt(e) {
	return e.nodeType === Node.CDATA_SECTION_NODE ? `<![CDATA[${e.textContent ?? ""}]]>` : e.textContent?.trim() ?? "";
}
function Ot(e) {
	return Array.from(e).filter((e) => P(e) && !F(e)).map(Dt).join("");
}
function kt(e) {
	return String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function At(e) {
	return e.replace(/\\/g, "/").replace(/^\.\//, "");
}
function jt(e) {
	let t = At(e), n = t.indexOf("assets/");
	return n === -1 ? null : t.slice(n);
}
function Mt(e) {
	switch (e.split(".").pop()?.toLowerCase() ?? "") {
		case "png": return "image/png";
		case "jpg":
		case "jpeg": return "image/jpeg";
		case "webp": return "image/webp";
		case "gif": return "image/gif";
		case "svg": return "image/svg+xml";
		default: return "application/octet-stream";
	}
}
function Nt(e, t) {
	let n = t;
	for (; n < e.length;) {
		let t = e[n];
		if (!t) {
			n += 1;
			continue;
		}
		if (t.nodeType !== Node.ELEMENT_NODE) {
			n += 1;
			continue;
		}
		let r = L(t);
		if (B(r)) break;
		if (M.has(r) || r === "h_thread" || r === "location") {
			n += 1;
			continue;
		}
		break;
	}
	return n;
}
function Pt(e, t) {
	let n = t;
	for (; n < e.length && F(e[n]);) n += 1;
	for (; n < e.length;) {
		let t = e[n];
		if (t && t.nodeType === Node.ELEMENT_NODE && M.has(L(t))) {
			for (n += 1; n < e.length && F(e[n]);) n += 1;
			continue;
		}
		break;
	}
	return n;
}
function Ft(e) {
	return mt.has(L(e));
}
function It(e) {
	let t = L(e);
	return t === "ldiv" || gt.has(t);
}
function Lt(e) {
	return V(e, "thread")?.getAttribute("thread_id") ?? null;
}
function Rt(e) {
	let t = V(e, "layer");
	if (t) {
		let e = t.getAttribute("value") ?? "body";
		return zt.has(e) ? e : "body";
	}
	if (yt(e).length === 4) return "body";
	let n = e.parentElement;
	if (!n) return "body";
	let r = [...n.childNodes], i = r.indexOf(e);
	return i < 0 ? "body" : Bt(r, i + 1);
}
var zt = /* @__PURE__ */ new Set([
	"body",
	"background",
	"furniture"
]);
function Bt(e, t) {
	let n = t;
	for (; n < e.length;) {
		let t = e[n];
		if (!t) {
			n += 1;
			continue;
		}
		if (t.nodeType !== Node.ELEMENT_NODE) {
			n += 1;
			continue;
		}
		let r = L(t);
		if (r === "layer") {
			let e = t.getAttribute("value") ?? "body";
			return zt.has(e) ? e : "body";
		}
		if (r === "location") break;
		if (M.has(r)) {
			n += 1;
			continue;
		}
		break;
	}
	return "body";
}
function Vt(e) {
	return e === "furniture" ? "layer-furniture" : e === "background" ? "layer-background" : "";
}
function Ht(e) {
	if (Ut(e)) return "text";
	let t = L(e);
	if (t === "heading" || t === "field_heading") return `${t}[${Tt(e)}]`;
	let n = e.getAttribute("level");
	if (n) return `${t}[${n}]`;
	let r = e.getAttribute("class");
	return r ? `${t}.${r}` : t;
}
function Ut(e) {
	if (yt(e).length === 4 || !Wt(e)) return !1;
	let t = L(e);
	return t === "ldiv" && e.parentElement && L(e.parentElement) === "list" ? !0 : B(t) && t !== "nl" && !_t.has(t) && e.parentElement ? N.has(L(e.parentElement)) : !1;
}
function Wt(e) {
	let t = e.parentElement;
	if (!t) return !1;
	let n = [...t.childNodes], r = n.indexOf(e);
	return r < 0 ? !1 : R(n, r + 1) !== null;
}
function Gt(e) {
	let t = e.parentElement;
	if (!t) return [];
	let n = [...t.childNodes], r = n.indexOf(e);
	return r < 0 ? [] : R(n, r + 1)?.locs ?? [];
}
function Kt(e) {
	let t = yt(e);
	return t.length === 4 ? t : Gt(e);
}
function qt(e) {
	if (!e) return !1;
	let t = L(e);
	if (t === "picture" || t === "caption") return !1;
	let n = e.parentElement;
	for (; n;) {
		if (L(n) === "picture") return !0;
		n = n.parentElement;
	}
	return !1;
}
function Jt(e) {
	if (!e) return !1;
	let t = L(e);
	if (N.has(t) || t === "caption") return !1;
	let n = e.parentElement;
	for (; n;) {
		if (N.has(L(n))) return !0;
		n = n.parentElement;
	}
	return !1;
}
//#endregion
//#region src/doclang/zip.ts
var Yt = 5e3, Xt = 134217728, Zt = 134217728, Qt = 536870912, $t = 100, en = new TextDecoder();
async function tn(e, { shouldExtract: t } = {}) {
	if (typeof DecompressionStream > "u") throw Error("ZIP decompression requires a browser with DecompressionStream support");
	let n = new Uint8Array(e), r = new DataView(e), i = nn(n), a = r.getUint16(i + 10, !0), o = r.getUint32(i + 16, !0);
	if (a > Yt) throw Error("ZIP archive has too many entries");
	if (o >= n.length) throw Error("Invalid ZIP central directory offset");
	let s = [], c = o, l = 0;
	for (let e = 0; e < a; e += 1) {
		if (c + 46 > n.length || r.getUint32(c, !0) !== 33639248) throw Error("Invalid ZIP central directory");
		let e = r.getUint16(c + 10, !0), i = r.getUint32(c + 20, !0), a = r.getUint32(c + 24, !0), o = r.getUint16(c + 28, !0), u = r.getUint16(c + 30, !0), d = r.getUint16(c + 32, !0), f = r.getUint32(c + 42, !0), p = c + 46 + o;
		if (p > n.length) throw Error("Invalid ZIP entry name");
		let m = on(en.decode(n.subarray(c + 46, p)));
		if (c = p + u + d, c > n.length) throw Error("Invalid ZIP central directory");
		if (!m || m.endsWith("/") || cn(m) || t && !t(m)) continue;
		if (i > Xt || a > Zt) throw Error(`ZIP entry exceeds size limit: ${m}`);
		if (i > 0 && a > 0 && a / i > $t) throw Error(`ZIP entry compression ratio exceeds limit: ${m}`);
		if (l + a > Qt) throw Error("ZIP archive exceeds total uncompressed size limit");
		if (f + 30 > n.length || r.getUint32(f, !0) !== 67324752) throw Error(`Invalid ZIP local header: ${m}`);
		let ee = r.getUint16(f + 26, !0), h = r.getUint16(f + 28, !0), g = f + 30 + ee + h;
		if (g + i > n.length) throw Error(`ZIP entry data out of bounds: ${m}`);
		let te = await an(n.subarray(g, g + i), e, a);
		if (l += te.length, l > Qt) throw Error("ZIP archive exceeds total uncompressed size limit");
		s.push({
			name: m,
			data: te
		});
	}
	return s;
}
function nn(e) {
	for (let t = e.length - 22; t >= 0; --t) if (e[t] === 80 && e[t + 1] === 75 && e[t + 2] === 5 && e[t + 3] === 6) return t;
	throw Error("Invalid ZIP archive");
}
function rn(e, t) {
	let n = new Uint8Array(t), r = 0;
	for (let t of e) n.set(t, r), r += t.byteLength;
	return n;
}
async function an(e, t, n) {
	if (t === 0) {
		if (e.length > Zt) throw Error("ZIP entry exceeds size limit");
		return e;
	}
	if (t === 8) {
		let t = new Blob([e]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader(), r = [], i = 0;
		try {
			for (;;) {
				let { done: n, value: a } = await t.read();
				if (n) break;
				if (i += a.byteLength, i > Zt) throw Error("ZIP entry exceeds size limit");
				if (e.length > 0 && i / e.length > $t) throw Error("ZIP entry compression ratio exceeds limit");
				r.push(a);
			}
		} catch (e) {
			try {
				await t.cancel();
			} catch {}
			throw e;
		}
		let a = rn(r, i);
		return n && a.length !== n ? a.slice(0, Math.min(a.length, n)) : a;
	}
	throw Error(`Unsupported ZIP compression method ${t}`);
}
function on(e) {
	return e.replace(/\\/g, "/").replace(/^\.\//, "");
}
function sn(e, t) {
	return e.find((e) => e.name === t);
}
function cn(e) {
	return e === ".DS_Store" || e.endsWith("/.DS_Store") ? !0 : e.split("/").some((e) => e.startsWith("._") || e === "__MACOSX");
}
async function ln(e) {
	let t = await tn(e), n = sn(t, "document.xml");
	if (!n) throw Error("Archive must contain document.xml");
	let r = new TextDecoder().decode(n.data), i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
	for (let e of t) {
		let t = e.name.match(/^pages\/(\d+)\.(png|jpe?g|webp)$/i);
		if (t) {
			i.set(Number(t[1]), URL.createObjectURL(new Blob([e.data], { type: Mt(e.name) })));
			continue;
		}
		e.name.startsWith("assets/") && !e.name.endsWith("/") && a.set(e.name, URL.createObjectURL(new Blob([e.data], { type: Mt(e.name) })));
	}
	return {
		markupXml: r,
		pageImages: i,
		assetUrls: a
	};
}
//#endregion
//#region src/doclang/document.ts
var un = /* @__PURE__ */ t({
	NO_MARKUP: () => fn,
	PAGE_IMAGE_RE: () => dn,
	assignElementIds: () => _n,
	buildDocumentState: () => Ln,
	buildElementPageMap: () => bn,
	buildThreadNavByElement: () => Sn,
	buildThreadPagesById: () => xn,
	collectBoundingBoxes: () => An,
	collectCaptionLinks: () => jn,
	collectFragmentLinks: () => Pn,
	collectFragmentNavItems: () => Fn,
	collectReadingOrderSteps: () => In,
	collectXrefLinks: () => Mn,
	computeReadingOrder: () => wn,
	computeReadingOrderDisplayNumbers: () => En,
	extractArchiveFromFiles: () => Rn,
	extractArchiveFromZipBuffer: () => ln,
	invertElementIds: () => vn,
	readDefaultResolution: () => gn,
	revokeDocumentState: () => zn,
	segmentHasMarkup: () => hn,
	splitIntoSegments: () => mn
}), dn = /^(\d+)\.(png|jpe?g|webp)$/i, fn = "(No markup to be shown.)", pn = /* @__PURE__ */ new Set([
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
function mn(e) {
	let t = I(e).filter((e) => L(e) !== "head"), n = [[]];
	for (let e of t) L(e) === "page_break" ? n.push([]) : n[n.length - 1].push(e);
	return n.length ? n : [[]];
}
function hn(e) {
	return e.some((e) => e.nodeType === Node.ELEMENT_NODE);
}
function gn(e) {
	let t = {
		width: 512,
		height: 512
	};
	if (!e) return t;
	let n = I(e).find((e) => L(e) === "default_resolution");
	if (!n) return t;
	let r = parseInt(n.getAttribute("width") ?? "512", 10), i = parseInt(n.getAttribute("height") ?? "512", 10);
	return {
		width: Number.isFinite(r) && r > 0 ? r : 512,
		height: Number.isFinite(i) && i > 0 ? i : 512
	};
}
function _n(e) {
	let t = /* @__PURE__ */ new Map(), n = 0;
	return z(e, (e) => {
		t.set(e, `el-${n++}`);
	}), t;
}
function vn(e) {
	let t = /* @__PURE__ */ new Map();
	for (let [n, r] of e) t.set(r, n);
	return t;
}
function yn(e) {
	let t = /* @__PURE__ */ new Map();
	return z(I(e).filter((e) => L(e) !== "head"), (e) => {
		for (let n of I(e)) {
			if (L(n) !== "thread") continue;
			let r = n.getAttribute("thread_id");
			r && (t.has(r) || t.set(r, []), t.get(r).push(e));
		}
	}), t;
}
function bn(e) {
	let t = /* @__PURE__ */ new Map();
	return e.forEach((e, n) => {
		let r = n + 1;
		z(e, (e) => t.set(e, r));
	}), t;
}
function xn(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of yn(e)) {
		let e = /* @__PURE__ */ new Set();
		for (let n of i) {
			let r = t.get(n);
			r && e.add(r);
		}
		e.size && n.set(r, e);
	}
	return n;
}
function Sn(e) {
	let t = /* @__PURE__ */ new Map();
	for (let [, n] of yn(e)) for (let e = 0; e < n.length; e += 1) t.set(n[e], {
		prev: e > 0 ? n[e - 1] : null,
		next: e < n.length - 1 ? n[e + 1] : null
	});
	return t;
}
function Cn(e) {
	let t = L(e);
	return t === "caption" || !(M.has(t) || t === "location" || t === "h_thread" || t === "page_break" || t === "nl" || _t.has(t) || pn.has(t) || t === "src" || t === "checkbox");
}
function wn(e) {
	let t = I(e).filter((e) => L(e) !== "head"), n = yn(e), r = /* @__PURE__ */ new Set(), i = [];
	function a(e) {
		Cn(e) && i.push(e);
	}
	function o(e) {
		for (let t of n.get(e) ?? []) r.has(t) || (r.add(t), c(t));
	}
	function s(e) {
		for (let t of e.childNodes) {
			if (t.nodeType !== Node.ELEMENT_NODE) continue;
			let e = t, n = L(e);
			if (n === "xref") {
				let t = e.getAttribute("thread_id");
				t && o(t);
				continue;
			}
			n !== "page_break" && c(e);
		}
	}
	function c(e) {
		a(e), s(e);
	}
	for (let e of t) L(e) !== "page_break" && (r.has(e) || c(e));
	return i;
}
function Tn(e) {
	return !Cn(e) || qt(e) || Jt(e) ? !1 : yt(e).length === 4 || Ut(e);
}
function En(e) {
	let t = /* @__PURE__ */ new Map(), n = 0;
	for (let r of e) Tn(r) && (n += 1, t.set(r, n));
	return t;
}
function Dn(e, t, n, r, i, a, o = "body") {
	let [s, c, l, u] = t, d = wt(s, n.width), f = wt(c, n.height);
	e.push({
		kind: r,
		tag: i,
		elementId: a,
		layer: o,
		x0: parseInt(s.getAttribute("value") ?? "0", 10),
		y0: parseInt(c.getAttribute("value") ?? "0", 10),
		x1: parseInt(l.getAttribute("value") ?? "0", 10),
		y1: parseInt(u.getAttribute("value") ?? "0", 10),
		resW: d,
		resH: f
	});
}
function On(e, t, n, r) {
	let i = [...e.childNodes], a = xt(i, 0);
	for (; a < i.length;) {
		let e = i[a];
		if (e.nodeType !== Node.ELEMENT_NODE || L(e) !== "ldiv") {
			a += 1;
			continue;
		}
		a += 1;
		let o = R(i, a);
		if (o) {
			let i = r.get(e);
			i && Dn(n, o.locs, t, "text", "text", i, Rt(e)), a = o.nextIndex;
		}
		a = St(i, a);
	}
}
function kn(e, t, n, r) {
	let i = [...e.childNodes], a = xt(i, 0);
	for (; a < i.length;) {
		let e = i[a];
		if (e.nodeType !== Node.ELEMENT_NODE) {
			a += 1;
			continue;
		}
		let o = L(e);
		if (!B(o)) {
			a += 1;
			continue;
		}
		if (o === "nl") {
			a += 1;
			continue;
		}
		a += 1;
		let s = R(i, a);
		if (s) {
			let i = r.get(e);
			i && Dn(n, s.locs, t, "text", "text", i, Rt(e)), a = s.nextIndex;
		}
		a = Ct(i, a);
	}
}
function An(e, t, n) {
	let r = [];
	return z(e, (e) => {
		let i = yt(e);
		if (i.length !== 4) return;
		let a = n.get(e);
		a && Dn(r, i, t, L(e), Ht(e), a, Rt(e));
	}), z(e, (e) => {
		let i = L(e);
		i === "list" ? On(e, t, r, n) : N.has(i) && kn(e, t, r, n);
	}), r;
}
function jn(e, t, n) {
	let r = new Map(n.map((e) => [e.elementId, e])), i = [];
	return z(e, (e) => {
		if (L(e) !== "caption") return;
		let n = t.get(e), a = n ? r.get(n) : null;
		if (!a) return;
		let o = e.parentElement;
		if (!o || yt(o).length !== 4) return;
		let s = t.get(o), c = s ? r.get(s) : null;
		c && i.push({
			captionBox: a,
			hostBox: c,
			captionElementId: n,
			hostElementId: s
		});
	}), i;
}
function Mn(e, t, n) {
	let r = new Map(n.map((e) => [e.elementId, e])), i = /* @__PURE__ */ new Map();
	z(e, (e) => {
		let n = t.get(e), a = n ? r.get(n) : null;
		if (a) for (let t of I(e)) {
			if (L(t) !== "thread") continue;
			let e = t.getAttribute("thread_id");
			e && (i.has(e) || i.set(e, []), i.get(e).push({
				elementId: n,
				box: a
			}));
		}
	});
	let a = [];
	return z(e, (e) => {
		let n = I(e).filter((e) => L(e) === "xref");
		if (!n.length) return;
		let o = Nn(e, t, r);
		if (o) for (let e of n) {
			let t = e.getAttribute("thread_id");
			if (t) for (let { elementId: e, box: n } of i.get(t) ?? []) e !== o.elementId && a.push({
				fromBox: o.box,
				toBox: n,
				fromElementId: o.elementId,
				toElementId: e
			});
		}
	}), a;
}
function Nn(e, t, n) {
	let r = e;
	for (; r;) {
		let e = t.get(r), i = e ? n.get(e) : null;
		if (i) return {
			elementId: e,
			box: i
		};
		if (L(r) === "doclang") break;
		r = r.parentElement;
	}
	return null;
}
function Pn(e, t, n, r, i) {
	let a = new Map(n.map((e) => [e.elementId, e])), o = /* @__PURE__ */ new Map();
	z(e, (e) => {
		let n = V(e, "thread")?.getAttribute("thread_id");
		if (!n) return;
		let r = t.get(e), i = r ? a.get(r) : null;
		i && (o.has(n) || o.set(n, []), o.get(n).push({
			elementId: r,
			box: i
		}));
	});
	let s = [];
	for (let [e, t] of o) {
		if (t.length >= 2) {
			for (let n = 0; n < t.length - 1; n += 1) s.push({
				fromBox: t[n].box,
				toBox: t[n + 1].box,
				fromElementId: t[n].elementId,
				toElementId: t[n + 1].elementId,
				threadId: e
			});
			continue;
		}
		if (t.length !== 1) continue;
		let n = i.get(e);
		if (!n) continue;
		let a = [...n].some((e) => e < r), o = [...n].some((e) => e > r);
		if (!a && !o) continue;
		let c = {
			fromBox: t[0].box,
			toBox: null,
			fromElementId: t[0].elementId,
			toElementId: null,
			threadId: e
		};
		a && s.push({
			...c,
			targetCorner: "tl"
		}), o && s.push({
			...c,
			targetCorner: "br"
		});
	}
	return s;
}
function Fn(e, t, n, r) {
	let i = new Map(n.map((e) => [e.elementId, e])), a = [];
	return z(e, (e) => {
		let n = r.get(e);
		if (!n || !n.prev && !n.next) return;
		let o = t.get(e), s = o ? i.get(o) : null;
		s && a.push({
			elementId: o,
			box: s,
			hasPrev: n.prev !== null,
			hasNext: n.next !== null
		});
	}), a;
}
function In(e, t, n, r, i = !0, a = null) {
	let o = new Map(n.map((e) => [e.elementId, e])), s = [], c = 0;
	return r.forEach((e) => {
		if (qt(e) || Jt(e)) return;
		let n = t.get(e);
		if (!n) return;
		let r = o.get(n);
		r && (c += 1, s.push({
			order: i ? a?.get(e) ?? c : c,
			box: r,
			elementId: n
		}));
	}), s;
}
function Ln(e, t, n, r, { markupOnly: i }) {
	let a = new DOMParser().parseFromString(e, "application/xml");
	if (a.querySelector("parsererror")) return alert(`Invalid XML in ${n}`), null;
	let o = a.documentElement;
	if (L(o) !== "doclang") return alert(`${n}: root element must be <doclang>`), null;
	let s = gn(I(o).find((e) => L(e) === "head") ?? null), c = i ? [I(o).filter((e) => L(e) !== "head")] : mn(o), l = !i && t.size > 0, u = l ? Math.max(...t.keys()) : 0, d = i ? 1 : Math.max(c.length, u, 1), f = wn(o), p = bn(c);
	return {
		pageImages: t,
		assetUrls: r,
		pageCount: d,
		segments: c,
		defaultResolution: s,
		elementIds: /* @__PURE__ */ new Map(),
		idToElement: /* @__PURE__ */ new Map(),
		hasPageView: l,
		markupOnly: i,
		docRoot: o,
		threadPagesById: xn(o, p),
		elementPageByEl: p,
		threadNavByElement: Sn(o),
		pendingSelectElement: null,
		readingOrder: f,
		readingOrderDisplayNumbers: En(f)
	};
}
async function Rn(e) {
	let t = e.find((e) => e.name === "document.xml");
	if (!t) throw Error("Archive must contain document.xml at its root.");
	let n = await t.text(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = t.webkitRelativePath || t.name, n = e.split("/");
		if (n.length >= 2 && n[n.length - 2] === "pages") {
			let e = dn.exec(t.name);
			e && r.set(Number(e[1]), URL.createObjectURL(t));
		}
		let a = jt(e);
		a && i.set(a, URL.createObjectURL(t));
	}
	return {
		markupXml: n,
		pageImages: r,
		assetUrls: i
	};
}
function zn(e) {
	if (e) {
		for (let t of e.pageImages.values()) t.startsWith("blob:") && URL.revokeObjectURL(t);
		for (let t of e.assetUrls.values()) t.startsWith("blob:") && URL.revokeObjectURL(t);
	}
}
//#endregion
//#region \0@oxc-project+runtime@0.144.0/helpers/esm/decorate.js
function H(e, t, n, r) {
	var i = arguments.length, a = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, o;
	if (typeof Reflect == "object" && typeof Reflect.decorate == "function") a = Reflect.decorate(e, t, n, r);
	else for (var s = e.length - 1; s >= 0; s--) (o = e[s]) && (a = (i < 3 ? o(a) : i > 3 ? o(t, n, a) : o(t, n)) || a);
	return i > 3 && a && Object.defineProperty(t, n, a), a;
}
//#endregion
//#region src/components/base/page-element.ts
var U = class extends T {
	constructor(...e) {
		super(...e), this._docState = null, this._peerIds = /* @__PURE__ */ new Set();
	}
	get document() {
		return this._docState;
	}
	set document(e) {
		let t = this._docState;
		this._docState = e, this.requestUpdate("_docState", t), e || (this.page = 1, this._clearDocument());
	}
	connectedCallback() {
		if (super.connectedCallback(), !this._docState && !this.getAttribute("src")) {
			let e = this.querySelector("script[type=\"application/doclang+xml\"]");
			e?.textContent?.trim() && this._loadXmlString(e.textContent.trim(), this.getAttribute("label") ?? "");
		}
	}
	disconnectedCallback() {
		super.disconnectedCallback();
	}
	attributeChangedCallback(e, t, n) {
		super.attributeChangedCallback(e, t, n), e === "src" && n && this._loadFromUrl(n);
	}
	updated(e) {
		if (super.updated(e), (e.has("page") || e.has("_docState")) && this._docState) {
			let e = Math.min(Math.max(1, this.page), this._docState.pageCount);
			if (e !== this.page) {
				this.page = e;
				return;
			}
			this._renderDocument();
		}
		e.has("selected") && (this._peerIds = this.selected ? this._computePeerIds(this.selected) : /* @__PURE__ */ new Set(), this._applySelection());
	}
	_applySelection() {}
	_clearDocument() {}
	_computePeerIds(e) {
		let t = /* @__PURE__ */ new Set();
		if (!this._docState?.elementIds || !this._docState.idToElement) return t;
		let n = this._docState.idToElement.get(e), r = n ? Lt(n) : null;
		if (!r) return t;
		for (let [e, n] of this._docState.elementIds) Lt(e) === r && t.add(n);
		return t;
	}
	_loadXmlString(e, t) {
		let n = Ln(e, /* @__PURE__ */ new Map(), t, /* @__PURE__ */ new Map(), { markupOnly: !0 });
		n && (this.document = n);
	}
	async _loadFromUrl(e) {
		try {
			let t = await fetch(e);
			if (!t.ok) throw Error(`HTTP ${t.status}`);
			if (e.includes(".dclx") || e.includes(".zip") || t.headers.get("content-type")?.includes("zip")) {
				let { extractArchiveFromZipBuffer: n } = await Promise.resolve().then(() => un), { markupXml: r, pageImages: i, assetUrls: a } = await n(await t.arrayBuffer()), o = Ln(r, i, e.split("/").pop() ?? "", a, { markupOnly: !1 });
				o && (this.document = o);
			} else {
				let n = await t.text(), r = e.split("/").pop() ?? "";
				this._loadXmlString(n, r);
			}
		} catch (e) {
			this.dispatchEvent(new CustomEvent("doclang-load-error", {
				bubbles: !0,
				composed: !0,
				detail: { error: e }
			}));
		}
	}
};
H([D({
	type: Number,
	reflect: !0
})], U.prototype, "page", void 0), H([D({
	type: String,
	reflect: !0
})], U.prototype, "selected", void 0), H([D({ type: String })], U.prototype, "src", void 0);
//#endregion
//#region src/components/page-nav/page-nav.ts
var Bn = class extends U {
	constructor(...e) {
		super(...e), this._inputRef = A(), this._onPrev = () => this._emitViewPage(this.page - 1), this._onNext = () => this._emitViewPage(this.page + 1), this._onInputKeydown = (e) => {
			e.key === "Enter" ? (e.preventDefault(), this._commitInput(), e.target.blur()) : e.key === "Escape" && (e.preventDefault(), this._resetInput(), e.target.blur());
		}, this._onInputBlur = () => this._resetInput();
	}
	static {
		this.styles = s(pt);
	}
	get _pageCount() {
		return this._docState?.pageCount ?? 1;
	}
	render() {
		let e = Math.max(1, String(this._pageCount).length);
		return b`
      <nav id="page-nav" aria-label="Page navigation">
        <div class="page-nav-btns">
          <button
            type="button"
            class="page-nav-btn btn-prev"
            aria-label="Previous page"
            title="Previous page"
            ?disabled=${this.page <= 1}
            @click=${this._onPrev}
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
            ?disabled=${this.page >= this._pageCount}
            @click=${this._onNext}
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
            ${j(this._inputRef)}
            type="text"
            inputmode="numeric"
            class="page-number-input"
            .value=${String(this.page)}
            style="--doclang-page-num-digits:${e}"
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
	updated(e) {
		super.updated(e), e.has("page") && this._resetInput();
	}
	_renderDocument() {}
	_clearDocument() {}
	_resetInput() {
		let e = this._inputRef.value;
		e && (e.value = String(this.page));
	}
	_commitInput() {
		let e = this._inputRef.value;
		if (!e) return;
		let t = Number.parseInt(e.value.trim(), 10);
		if (!Number.isFinite(t)) {
			this._resetInput();
			return;
		}
		this._emitViewPage(Math.min(Math.max(1, t), this._docState?.pageCount ?? 1));
	}
	_emitViewPage(e) {
		this.dispatchEvent(new CustomEvent("view-page", {
			bubbles: !0,
			composed: !0,
			detail: { page: e }
		}));
	}
};
Bn = H([E("doclang-page-nav")], Bn);
//#endregion
//#region node_modules/lit-html/directives/class-map.js
var W = nt(class extends rt {
	constructor(e) {
		if (super(e), e.type !== tt.ATTRIBUTE || e.name !== "class" || e.strings?.length > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
	}
	render(e) {
		return " " + Object.keys(e).filter((t) => e[t]).join(" ") + " ";
	}
	update(e, [t]) {
		if (this.st === void 0) {
			this.st = /* @__PURE__ */ new Set(), e.strings !== void 0 && (this.nt = new Set(e.strings.join(" ").split(/\s/).filter((e) => e !== "")));
			for (let e in t) t[e] && !this.nt?.has(e) && this.st.add(e);
			return this.render(t);
		}
		let n = e.element.classList;
		for (let e of this.st) e in t || (n.remove(e), this.st.delete(e));
		for (let e in t) {
			let r = !!t[e];
			r === this.st.has(e) || this.nt?.has(e) || (r ? (n.add(e), this.st.add(e)) : (n.remove(e), this.st.delete(e)));
		}
		return S;
	}
}), Vn = ":host{--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark;--bg:var(--doclang-bg,#f4f4f5);--panel:var(--doclang-panel,#fff);--border:var(--doclang-border,#d4d4d8);--text:var(--doclang-text,#18181b);--muted:var(--doclang-muted,#71717a);--accent:var(--doclang-accent,#2563eb);--placeholder-bg:var(--doclang-placeholder-bg,#fafafa);--font-ui:var(--doclang-font-ui,system-ui, -apple-system, \"Segoe UI\", sans-serif);--font-mono:var(--doclang-font-mono,ui-monospace, \"Cascadia Code\", \"Source Code Pro\", monospace);--markup-bg:var(--doclang-markup-bg,#fff);--markup-fg:var(--doclang-markup-fg,#24292e);--markup-hover:var(--doclang-markup-hover,#2563eb14);--markup-selected:var(--doclang-markup-selected,#2563eb24);--kind-text:var(--doclang-kind-text,#2563eb);--kind-heading:var(--doclang-kind-heading,#7c3aed);--kind-list:var(--doclang-kind-list,#ea580c);--kind-ldiv:var(--doclang-kind-ldiv,#ea580c);--kind-table:var(--doclang-kind-table,#16a34a);--kind-index:var(--doclang-kind-index,#0d9488);--kind-formula:var(--doclang-kind-formula,#0891b2);--kind-code:var(--doclang-kind-code,#475569);--kind-picture:var(--doclang-kind-picture,#db2777);--kind-group:var(--doclang-kind-group,#4f46e5);--kind-footnote:var(--doclang-kind-footnote,#a16207);--kind-page_header:var(--doclang-kind-page_header,#71717a);--kind-page_footer:var(--doclang-kind-page_footer,#71717a);--kind-caption:var(--doclang-kind-caption,#71717a);--kind-field:var(--doclang-kind-field,#d97706);--kind-default:var(--doclang-kind-default,#dc2626)}@media (prefers-color-scheme:dark){:host{--lightningcss-light: ;--lightningcss-dark:initial;--bg:var(--doclang-bg,#09090b);--panel:var(--doclang-panel,#18181b);--border:var(--doclang-border,#3f3f46);--text:var(--doclang-text,#fafafa);--muted:var(--doclang-muted,#a1a1aa);--placeholder-bg:var(--doclang-placeholder-bg,#27272a);--markup-bg:var(--doclang-markup-bg,#1e1e1e);--markup-fg:var(--doclang-markup-fg,#d4d4d4);--markup-hover:var(--doclang-markup-hover,#60a5fa1a);--markup-selected:var(--doclang-markup-selected,#60a5fa2e);--kind-text:var(--doclang-kind-text,#60a5fa);--kind-heading:var(--doclang-kind-heading,#a78bfa);--kind-list:var(--doclang-kind-list,#fb923c);--kind-ldiv:var(--doclang-kind-ldiv,#fb923c);--kind-table:var(--doclang-kind-table,#4ade80);--kind-index:var(--doclang-kind-index,#2dd4bf);--kind-formula:var(--doclang-kind-formula,#22d3ee);--kind-code:var(--doclang-kind-code,#94a3b8);--kind-picture:var(--doclang-kind-picture,#f472b6);--kind-group:var(--doclang-kind-group,#818cf8);--kind-footnote:var(--doclang-kind-footnote,#facc15);--kind-page_header:var(--doclang-kind-page_header,#a1a1aa);--kind-page_footer:var(--doclang-kind-page_footer,#a1a1aa);--kind-caption:var(--doclang-kind-caption,#a1a1aa);--kind-field:var(--doclang-kind-field,#fbbf24);--kind-default:var(--doclang-kind-default,#f87171)}}:host{display:contents}.toolbar{flex-wrap:wrap;grid-column:3;justify-self:end;align-items:center;gap:.5rem;display:flex}.header-divider{background:var(--border);flex-shrink:0;align-self:center;width:1px;height:1.125rem}.toolbar-options-item{cursor:pointer;font-size:.875rem;font-family:var(--font-ui);align-items:center;gap:.5rem;padding:.35rem .75rem;display:flex}.toolbar-options-item:hover{background:color-mix(in srgb, var(--accent) 6%, var(--panel))}.toolbar-options-item input{cursor:pointer;flex-shrink:0;margin:0}.toolbar-options-item-disabled{opacity:.45;cursor:not-allowed}.toolbar-options-item-disabled input{cursor:not-allowed}.toolbar-options-divider{border-top:1px solid var(--border);margin:.35rem 0}.toolbar-options-reset{box-sizing:border-box;width:100%;color:var(--text);font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:0;margin:0;padding:.35rem .75rem;font-size:.875rem;display:block}.toolbar-options-reset:hover:not(:disabled){background:color-mix(in srgb, var(--accent) 6%, var(--panel));color:var(--accent)}.toolbar-options-reset:disabled{opacity:.45;cursor:not-allowed}.toolbar-file-group{align-items:center;display:inline-flex}button,label.file-btn{appearance:none;border:1px solid var(--border);background:var(--panel);color:var(--text);font:inherit;cursor:pointer;border-radius:.375rem;padding:.4rem .75rem;font-size:.875rem}button:hover,label.file-btn:hover{border-color:var(--accent)}button:disabled{opacity:.45;cursor:not-allowed}label.file-btn input{display:none}.header-site-link{color:var(--muted);white-space:nowrap;font-size:.875rem;text-decoration:none}.header-site-link:hover{color:var(--accent);text-decoration:underline}.header-site-link:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:.125rem}", Hn = ":host{--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark;--bg:var(--doclang-bg,#f4f4f5);--panel:var(--doclang-panel,#fff);--border:var(--doclang-border,#d4d4d8);--text:var(--doclang-text,#18181b);--muted:var(--doclang-muted,#71717a);--accent:var(--doclang-accent,#2563eb);--placeholder-bg:var(--doclang-placeholder-bg,#fafafa);--font-ui:var(--doclang-font-ui,system-ui, -apple-system, \"Segoe UI\", sans-serif);--font-mono:var(--doclang-font-mono,ui-monospace, \"Cascadia Code\", \"Source Code Pro\", monospace);--markup-bg:var(--doclang-markup-bg,#fff);--markup-fg:var(--doclang-markup-fg,#24292e);--markup-hover:var(--doclang-markup-hover,#2563eb14);--markup-selected:var(--doclang-markup-selected,#2563eb24);--kind-text:var(--doclang-kind-text,#2563eb);--kind-heading:var(--doclang-kind-heading,#7c3aed);--kind-list:var(--doclang-kind-list,#ea580c);--kind-ldiv:var(--doclang-kind-ldiv,#ea580c);--kind-table:var(--doclang-kind-table,#16a34a);--kind-index:var(--doclang-kind-index,#0d9488);--kind-formula:var(--doclang-kind-formula,#0891b2);--kind-code:var(--doclang-kind-code,#475569);--kind-picture:var(--doclang-kind-picture,#db2777);--kind-group:var(--doclang-kind-group,#4f46e5);--kind-footnote:var(--doclang-kind-footnote,#a16207);--kind-page_header:var(--doclang-kind-page_header,#71717a);--kind-page_footer:var(--doclang-kind-page_footer,#71717a);--kind-caption:var(--doclang-kind-caption,#71717a);--kind-field:var(--doclang-kind-field,#d97706);--kind-default:var(--doclang-kind-default,#dc2626)}@media (prefers-color-scheme:dark){:host{--lightningcss-light: ;--lightningcss-dark:initial;--bg:var(--doclang-bg,#09090b);--panel:var(--doclang-panel,#18181b);--border:var(--doclang-border,#3f3f46);--text:var(--doclang-text,#fafafa);--muted:var(--doclang-muted,#a1a1aa);--placeholder-bg:var(--doclang-placeholder-bg,#27272a);--markup-bg:var(--doclang-markup-bg,#1e1e1e);--markup-fg:var(--doclang-markup-fg,#d4d4d4);--markup-hover:var(--doclang-markup-hover,#60a5fa1a);--markup-selected:var(--doclang-markup-selected,#60a5fa2e);--kind-text:var(--doclang-kind-text,#60a5fa);--kind-heading:var(--doclang-kind-heading,#a78bfa);--kind-list:var(--doclang-kind-list,#fb923c);--kind-ldiv:var(--doclang-kind-ldiv,#fb923c);--kind-table:var(--doclang-kind-table,#4ade80);--kind-index:var(--doclang-kind-index,#2dd4bf);--kind-formula:var(--doclang-kind-formula,#22d3ee);--kind-code:var(--doclang-kind-code,#94a3b8);--kind-picture:var(--doclang-kind-picture,#f472b6);--kind-group:var(--doclang-kind-group,#818cf8);--kind-footnote:var(--doclang-kind-footnote,#facc15);--kind-page_header:var(--doclang-kind-page_header,#a1a1aa);--kind-page_footer:var(--doclang-kind-page_footer,#a1a1aa);--kind-caption:var(--doclang-kind-caption,#a1a1aa);--kind-field:var(--doclang-kind-field,#fbbf24);--kind-default:var(--doclang-kind-default,#f87171)}}:host{display:contents}.dropdown-wrap{position:relative}.dropdown-btn{appearance:none;color:var(--muted);cursor:pointer;white-space:nowrap;font-size:.8125rem;font-weight:500;line-height:1.2;font:inherit;background:0 0;border:1px solid #0000;border-radius:.375rem;flex-shrink:0;align-items:center;padding:.35rem .45rem .35rem .55rem;transition:color .12s,background .12s,border-color .12s;display:inline-flex}.dropdown-btn:after{content:\"\";opacity:.65;border-bottom:1.5px solid;border-right:1.5px solid;flex-shrink:0;width:.32rem;height:.32rem;margin-top:-.14em;margin-left:.3rem;transform:rotate(45deg)}.dropdown-btn:hover{color:var(--text);background:color-mix(in srgb, var(--text) 5%, transparent)}.dropdown-btn[aria-expanded=true]{color:var(--accent);background:color-mix(in srgb, var(--accent) 10%, var(--panel));border-color:color-mix(in srgb, var(--accent) 22%, transparent)}.dropdown-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.dropdown-panel{z-index:30;border:1px solid var(--border);background:var(--panel);min-width:11rem;box-shadow:0 .5rem 1.25rem color-mix(in srgb, var(--text) 12%, transparent);border-radius:.375rem;padding:.5rem 0;position:absolute;top:calc(100% + .35rem);right:0}", Un = class extends T {
	constructor(...e) {
		super(...e), this.label = "", this._open = !1, this._onBtnClick = (e) => {
			e.stopPropagation(), this.setOpen(!this._open);
		}, this._onDocClick = (e) => {
			this._open && (e.composedPath().includes(this) || this.setOpen(!1));
		}, this._onDocKeydown = (e) => {
			this._open && e.key === "Escape" && this.setOpen(!1);
		};
	}
	static {
		this.styles = s(Hn);
	}
	render() {
		return b`
      <div class="dropdown-wrap">
        <button
          type="button"
          class="dropdown-btn"
          aria-expanded=${this._open ? "true" : "false"}
          aria-haspopup="true"
          @click=${this._onBtnClick}
        >
          ${this.label}
        </button>
        ${this._open ? b`<div class="dropdown-panel" role="menu"><slot></slot></div>` : C}
      </div>
    `;
	}
	setOpen(e) {
		this._open = e, this.requestUpdate();
	}
	get isOpen() {
		return this._open;
	}
	connectedCallback() {
		super.connectedCallback(), document.addEventListener("click", this._onDocClick), document.addEventListener("keydown", this._onDocKeydown);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), document.removeEventListener("click", this._onDocClick), document.removeEventListener("keydown", this._onDocKeydown);
	}
};
H([D({ type: String })], Un.prototype, "label", void 0), Un = H([E("doclang-dropdown")], Un);
//#endregion
//#region src/components/viewer/toolbar.ts
var Wn = class extends T {
	constructor(...e) {
		super(...e), this._demoLoading = !1, this._panes = {
			file: !0,
			page: !0,
			markup: !0,
			reading: !0,
			fileAvailable: !1,
			pageAvailable: !1,
			hasState: !1
		}, this._inputArchiveRef = A(), this._dropdownRef = A(), this._onArchiveChange = (e) => {
			let t = e.target;
			this.dispatchEvent(new CustomEvent("doclang-open-files", {
				bubbles: !0,
				composed: !0,
				detail: { files: [...t.files ?? []] }
			})), t.value = "";
		};
	}
	static {
		this.styles = s(Vn);
	}
	render() {
		let { file: e, page: t, markup: n, reading: r, fileAvailable: i, pageAvailable: a, hasState: o } = this._panes;
		return b`
      <div class="toolbar">
        <doclang-dropdown
          ${j(this._dropdownRef)}
          label="Views"
        >
          <label
            class=${W({
			"toolbar-options-item": !0,
			"toolbar-options-item-disabled": !i
		})}
          >
            <input
              type="checkbox"
              class="cb-file-pane"
              role="menuitemcheckbox"
              .checked=${i && e}
              ?disabled=${!i}
              @change=${(e) => this._emitTogglePane("file", e.target.checked)}
            />
            <span>Files</span>
          </label>
          <label
            class=${W({
			"toolbar-options-item": !0,
			"toolbar-options-item-disabled": !a
		})}
          >
            <input
              type="checkbox"
              class="cb-page-pane"
              role="menuitemcheckbox"
              .checked=${a && t}
              ?disabled=${!a}
              @change=${(e) => this._emitTogglePane("page", e.target.checked)}
            />
            <span>Original page</span>
          </label>
          <label
            class=${W({
			"toolbar-options-item": !0,
			"toolbar-options-item-disabled": !o
		})}
          >
            <input
              type="checkbox"
              class="cb-markup-pane"
              role="menuitemcheckbox"
              .checked=${n}
              ?disabled=${!o}
              @change=${(e) => this._emitTogglePane("markup", e.target.checked)}
            />
            <span>DocLang</span>
          </label>
          <label
            class=${W({
			"toolbar-options-item": !0,
			"toolbar-options-item-disabled": !o
		})}
          >
            <input
              type="checkbox"
              class="cb-reading-pane"
              role="menuitemcheckbox"
              .checked=${r}
              ?disabled=${!o}
              @change=${(e) => this._emitTogglePane("reading", e.target.checked)}
            />
            <span>Reading view</span>
          </label>
          <div class="toolbar-options-divider" role="separator"></div>
          <button
            type="button"
            class="toolbar-options-reset"
            role="menuitem"
            ?disabled=${!o}
            @click=${() => this.dispatchEvent(new CustomEvent("doclang-reset-pane-layout", {
			bubbles: !0,
			composed: !0
		}))}
          >
            Reset views
          </button>
        </doclang-dropdown>
        <span class="header-divider" aria-hidden="true"></span>
        <span class="toolbar-file-group">
          <label
            class="file-btn"
            title="Open a DocLang file (.dclx, .dclg)"
          >
            Open file
            <input
              ${j(this._inputArchiveRef)}
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
			bubbles: !0,
			composed: !0
		}))}
        >
          Load demo
        </button>
        <span class="header-divider" aria-hidden="true"></span>
        <a href="https://doclang.ai/" class="header-site-link">doclang.ai</a>
      </div>
    `;
	}
	syncPaneToggles(e) {
		this._panes = e, this.requestUpdate();
	}
	setDemoLoading(e) {
		this._demoLoading = e, this.requestUpdate();
	}
	_emitTogglePane(e, t) {
		this.dispatchEvent(new CustomEvent("doclang-toggle-pane", {
			bubbles: !0,
			composed: !0,
			detail: {
				pane: e,
				checked: t
			}
		}));
	}
};
Wn = H([E("doclang-toolbar")], Wn);
//#endregion
//#region node_modules/lit-html/directives/repeat.js
var Gn = (e, t, n) => {
	let r = /* @__PURE__ */ new Map();
	for (let i = t; i <= n; i++) r.set(e[i], i);
	return r;
}, Kn = nt(class extends rt {
	constructor(e) {
		if (super(e), e.type !== tt.CHILD) throw Error("repeat() can only be used in text expressions");
	}
	dt(e, t, n) {
		let r;
		n === void 0 ? n = t : t !== void 0 && (r = t);
		let i = [], a = [], o = 0;
		for (let t of e) i[o] = r ? r(t, o) : o, a[o] = n(t, o), o++;
		return {
			values: a,
			keys: i
		};
	}
	render(e, t, n) {
		return this.dt(e, t, n).values;
	}
	update(e, [t, n, r]) {
		let i = $e(e), { values: a, keys: o } = this.dt(t, n, r);
		if (!Array.isArray(i)) return this.ut = o, a;
		let s = this.ut ??= [], c = [], l, u, d = 0, f = i.length - 1, p = 0, m = a.length - 1;
		for (; d <= f && p <= m;) if (i[d] === null) d++;
		else if (i[f] === null) f--;
		else if (s[d] === o[p]) c[p] = k(i[d], a[p]), d++, p++;
		else if (s[f] === o[m]) c[m] = k(i[f], a[m]), f--, m--;
		else if (s[d] === o[m]) c[m] = k(i[d], a[m]), Xe(e, c[m + 1], i[d]), d++, m--;
		else if (s[f] === o[p]) c[p] = k(i[f], a[p]), Xe(e, i[d], i[f]), f--, p++;
		else if (l === void 0 && (l = Gn(o, p, m), u = Gn(s, d, f)), l.has(s[d])) {
			if (l.has(s[f])) {
				let t = u.get(o[p]), n = t === void 0 ? null : i[t];
				if (n === null) {
					let t = Xe(e, i[d]);
					k(t, a[p]), c[p] = t;
				} else c[p] = k(n, a[p]), Xe(e, i[d], n), i[t] = null;
				p++;
			} else et(i[f]), f--;
		} else et(i[d]), d++;
		for (; p <= m;) {
			let t = Xe(e, c[m + 1]);
			k(t, a[p]), c[p++] = t;
		}
		for (; d <= f;) {
			let e = i[d++];
			e !== null && et(e);
		}
		return this.ut = o, Qe(e, c), S;
	}
}), qn = ":host{--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark;--bg:var(--doclang-bg,#f4f4f5);--panel:var(--doclang-panel,#fff);--border:var(--doclang-border,#d4d4d8);--text:var(--doclang-text,#18181b);--muted:var(--doclang-muted,#71717a);--accent:var(--doclang-accent,#2563eb);--placeholder-bg:var(--doclang-placeholder-bg,#fafafa);--font-ui:var(--doclang-font-ui,system-ui, -apple-system, \"Segoe UI\", sans-serif);--font-mono:var(--doclang-font-mono,ui-monospace, \"Cascadia Code\", \"Source Code Pro\", monospace);--markup-bg:var(--doclang-markup-bg,#fff);--markup-fg:var(--doclang-markup-fg,#24292e);--markup-hover:var(--doclang-markup-hover,#2563eb14);--markup-selected:var(--doclang-markup-selected,#2563eb24);--kind-text:var(--doclang-kind-text,#2563eb);--kind-heading:var(--doclang-kind-heading,#7c3aed);--kind-list:var(--doclang-kind-list,#ea580c);--kind-ldiv:var(--doclang-kind-ldiv,#ea580c);--kind-table:var(--doclang-kind-table,#16a34a);--kind-index:var(--doclang-kind-index,#0d9488);--kind-formula:var(--doclang-kind-formula,#0891b2);--kind-code:var(--doclang-kind-code,#475569);--kind-picture:var(--doclang-kind-picture,#db2777);--kind-group:var(--doclang-kind-group,#4f46e5);--kind-footnote:var(--doclang-kind-footnote,#a16207);--kind-page_header:var(--doclang-kind-page_header,#71717a);--kind-page_footer:var(--doclang-kind-page_footer,#71717a);--kind-caption:var(--doclang-kind-caption,#71717a);--kind-field:var(--doclang-kind-field,#d97706);--kind-default:var(--doclang-kind-default,#dc2626)}@media (prefers-color-scheme:dark){:host{--lightningcss-light: ;--lightningcss-dark:initial;--bg:var(--doclang-bg,#09090b);--panel:var(--doclang-panel,#18181b);--border:var(--doclang-border,#3f3f46);--text:var(--doclang-text,#fafafa);--muted:var(--doclang-muted,#a1a1aa);--placeholder-bg:var(--doclang-placeholder-bg,#27272a);--markup-bg:var(--doclang-markup-bg,#1e1e1e);--markup-fg:var(--doclang-markup-fg,#d4d4d4);--markup-hover:var(--doclang-markup-hover,#60a5fa1a);--markup-selected:var(--doclang-markup-selected,#60a5fa2e);--kind-text:var(--doclang-kind-text,#60a5fa);--kind-heading:var(--doclang-kind-heading,#a78bfa);--kind-list:var(--doclang-kind-list,#fb923c);--kind-ldiv:var(--doclang-kind-ldiv,#fb923c);--kind-table:var(--doclang-kind-table,#4ade80);--kind-index:var(--doclang-kind-index,#2dd4bf);--kind-formula:var(--doclang-kind-formula,#22d3ee);--kind-code:var(--doclang-kind-code,#94a3b8);--kind-picture:var(--doclang-kind-picture,#f472b6);--kind-group:var(--doclang-kind-group,#818cf8);--kind-footnote:var(--doclang-kind-footnote,#facc15);--kind-page_header:var(--doclang-kind-page_header,#a1a1aa);--kind-page_footer:var(--doclang-kind-page_footer,#a1a1aa);--kind-caption:var(--doclang-kind-caption,#a1a1aa);--kind-field:var(--doclang-kind-field,#fbbf24);--kind-default:var(--doclang-kind-default,#f87171)}}:host{border-right:1px solid var(--border);background:var(--panel);--file-thumb-size:var(--doclang-file-thumb-size,3.75rem);--file-thumb-close-overflow:var(--doclang-file-thumb-close-overflow,.25rem);--file-item-pad-x:var(--doclang-file-item-pad-x,.35rem);--file-pane-pad-x:var(--doclang-file-pane-pad-x,.5rem);--file-pane-fit-width:var(--doclang-file-pane-fit-width,calc(( var(--file-pane-pad-x) * 2 + var(--file-item-pad-x) * 2 + var(--file-thumb-size) + var(--file-thumb-close-overflow) ) * 1.5));flex-direction:column;min-width:0;min-height:0;display:flex;overflow:hidden}:host([hidden]){display:none!important}:host(.pane-layout-last){border-right:none}.pane-header{box-sizing:border-box;letter-spacing:.04em;text-transform:uppercase;height:2.125rem;color:var(--muted);border-bottom:1px solid var(--border);background:var(--panel);justify-content:space-between;align-items:center;gap:.35rem;padding:0 .35rem;font-size:.75rem;font-weight:600;display:flex}.pane-header-title{text-overflow:ellipsis;white-space:nowrap;min-width:0;padding-inline:.4rem;overflow:hidden}.file-pane-close-all{appearance:none;color:var(--muted);font:inherit;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;white-space:nowrap;background:0 0;border:1px solid #0000;border-radius:.25rem;flex-shrink:0;height:1.25rem;padding:0 .15rem;font-size:.625rem;font-weight:600;line-height:1;transition:color .12s,background .12s,border-color .12s}.file-pane-close-all:hover{color:var(--text);background:color-mix(in srgb, var(--text) 5%, transparent)}.file-pane-close-all:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.pane-body{min-height:0;padding:.375rem var(--file-pane-pad-x,.5rem);flex:1;min-width:0;overflow:auto}.file-view-list{flex-direction:column;gap:.25rem;width:100%;min-width:0;margin:0;padding:0;list-style:none;display:flex}.file-view-list>li{width:100%;max-width:100%}.file-view-item{box-sizing:border-box;width:100%;max-width:100%;color:var(--text);font:inherit;text-align:center;padding:.5rem var(--file-item-pad-x,.35rem);cursor:pointer;background:0 0;border:none;border-radius:0;flex-direction:column;align-items:center;gap:.35rem;font-size:.8125rem;line-height:1.35;display:flex}.file-view-thumb-wrap{flex-shrink:0;position:relative}.file-view-close{appearance:none;border:1px solid var(--border);background:var(--bg);width:1rem;height:1rem;color:var(--muted);font:inherit;cursor:pointer;z-index:1;border-radius:50%;justify-content:center;align-items:center;padding:0;font-size:.75rem;line-height:1;display:flex;position:absolute;top:-.25rem;right:-.25rem;box-shadow:0 1px 2px #00000014}.file-view-close:hover{color:var(--text);background:var(--panel)}.file-view-close:focus-visible{outline:2px solid var(--accent);outline-offset:1px}.file-view-thumb{width:var(--file-thumb-size,3.75rem);height:var(--file-thumb-size,3.75rem);background:var(--placeholder-bg);border:1px solid var(--border);border-radius:.25rem;flex-shrink:0;justify-content:center;align-items:center;display:flex;overflow:hidden}.file-view-thumb img{object-fit:contain;width:100%;height:100%;display:block}.file-view-thumb-placeholder{width:100%;height:100%;color:var(--muted);justify-content:center;align-items:center;display:flex}.file-view-thumb-placeholder svg{width:1.875rem;height:1.875rem;display:block}.file-view-label{text-overflow:ellipsis;white-space:nowrap;width:100%;max-width:100%;overflow:hidden}.file-view-item:hover{background:var(--markup-hover)}.file-view-item.is-active{background:var(--markup-selected);color:var(--accent);font-weight:500}.file-view-item:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}", Jn = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" aria-hidden=\"true\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><polyline points=\"14 2 14 8 20 8\"/><line x1=\"16\" y1=\"13\" x2=\"8\" y2=\"13\"/><line x1=\"16\" y1=\"17\" x2=\"8\" y2=\"17\"/></svg>", Yn = class extends T {
	constructor(...e) {
		super(...e), this._onCloseAll = () => {
			this.dispatchEvent(new CustomEvent("doclang-collection-close-all", {
				bubbles: !0,
				composed: !0
			}));
		}, this._renderEntry = (e, t) => {
			let n = (e) => {
				e.target.closest(".file-view-close") || this._emitSelect(t);
			}, r = (e) => {
				(e.key === "Enter" || e.key === " ") && (e.preventDefault(), this._emitSelect(t));
			}, i = (e) => {
				e.stopPropagation(), this._emitClose(t);
			}, a = e.thumbnailUrl ? b`<img src=${e.thumbnailUrl} alt="" />` : b`<span
          class="file-view-thumb-placeholder"
          .innerHTML=${Jn}
        ></span>`;
			return b`
      <li>
        <div
          class="file-view-item${e.isActive ? " is-active" : ""}"
          title=${e.label}
          tabindex="0"
          role="option"
          aria-selected=${e.isActive ? "true" : "false"}
          @click=${n}
          @keydown=${r}
        >
          <div class="file-view-thumb-wrap">
            <span class="file-view-thumb" aria-hidden="true">${a}</span>
            <button
              type="button"
              class="file-view-close"
              aria-label="Close ${e.label}"
              @click=${i}
            >
              ×
            </button>
          </div>
          <span class="file-view-label">${e.label}</span>
        </div>
      </li>
    `;
		};
	}
	static {
		this.styles = s(qn);
	}
	render() {
		let e = (this.entries?.length ?? 0) > 0;
		return b`
      <div class="pane-header">
        <span class="pane-header-title">Files</span>
        ${e ? b`<button
          type="button"
          class="file-pane-close-all"
          aria-label="Clear all open files"
          @click=${this._onCloseAll}
        >
          Clear
        </button>` : C}
      </div>
      <div class="pane-body">${e ? b`
          <ul class="file-view-list" role="listbox" aria-label="Open files">
            ${Kn(this.entries ?? [], (e, t) => t, this._renderEntry)}
          </ul>
        ` : C}</div>
    `;
	}
	_emitSelect(e) {
		this.dispatchEvent(new CustomEvent("doclang-collection-select", {
			bubbles: !0,
			composed: !0,
			detail: { index: e }
		}));
	}
	_emitClose(e) {
		this.dispatchEvent(new CustomEvent("doclang-collection-close", {
			bubbles: !0,
			composed: !0,
			detail: { index: e }
		}));
	}
};
H([D({ attribute: !1 })], Yn.prototype, "entries", void 0), Yn = H([E("doclang-collection-pane")], Yn);
//#endregion
//#region src/components/base/page-controller.ts
var Xn = 200, Zn = 4, Qn = 100, $n = class {
	constructor(e, t) {
		this._pixelAccum = 0, this._gestureUntil = 0, this._lastFlipAt = 0, this._lastPage = null, this._onKeyDown = (e) => {
			let t = e, n = this._host, r = n.document;
			if (!r || r.markupOnly || r.pageCount <= 1) return;
			let i = 0;
			switch (t.key) {
				case "ArrowDown":
				case "PageDown":
				case "ArrowRight":
					i = 1;
					break;
				case "ArrowUp":
				case "PageUp":
				case "ArrowLeft": i = -1;
			}
			if (!i) return;
			t.preventDefault();
			let a = n.page + i;
			a < 1 || a > r.pageCount || n.dispatchEvent(new CustomEvent("view-page", {
				bubbles: !0,
				composed: !0,
				detail: { page: a }
			}));
		}, this._onWheel = (e) => {
			let t = e, n = this._host, r = n.document;
			if (!r || r.markupOnly || r.pageCount <= 1) return;
			let i = this._getScrollPane(), a = this._dir(t);
			if (!a) return;
			if (i) {
				let e = i.scrollTop <= 0, t = i.scrollTop + i.clientHeight >= i.scrollHeight - 1;
				if ((i.scrollHeight > i.clientHeight || i.scrollWidth > i.clientWidth) && !(a < 0 && e) && !(a > 0 && t)) return;
			}
			let o = performance.now();
			if (o - this._lastFlipAt < Xn) {
				t.preventDefault();
				return;
			}
			let s = n.page + a;
			if (s < 1 || s > r.pageCount) {
				t.preventDefault();
				return;
			}
			t.preventDefault(), this._lastFlipAt = o, n.dispatchEvent(new CustomEvent("view-page", {
				bubbles: !0,
				composed: !0,
				detail: { page: s }
			}));
		}, this._host = e, this._getScrollPane = t, e.addController(this);
	}
	hostConnected() {
		this._host.addEventListener("wheel", this._onWheel, { passive: !1 }), this._host.addEventListener("keydown", this._onKeyDown);
	}
	hostDisconnected() {
		this._host.removeEventListener("wheel", this._onWheel), this._host.removeEventListener("keydown", this._onKeyDown);
	}
	hostUpdated() {
		let e = this._host.page;
		if (this._lastPage !== null && this._lastPage !== e) {
			let t = this._getScrollPane();
			t && (t.scrollTop = (e > this._lastPage ? 1 : -1) > 0 ? 0 : t.scrollHeight);
		}
		this._lastPage = e;
	}
	_dir(e) {
		if (e.deltaMode === 1) return e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
		if (e.deltaMode === 2) return Math.sign(e.deltaY);
		let t = performance.now();
		if (t > this._gestureUntil && (this._pixelAccum = 0), this._gestureUntil = t + Qn, this._pixelAccum += e.deltaY, Math.abs(this._pixelAccum) >= Zn) {
			let e = this._pixelAccum > 0 ? 1 : -1;
			return this._pixelAccum = 0, e;
		}
		return 0;
	}
}, er = ":host{--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark;--bg:var(--doclang-bg,#f4f4f5);--panel:var(--doclang-panel,#fff);--border:var(--doclang-border,#d4d4d8);--text:var(--doclang-text,#18181b);--muted:var(--doclang-muted,#71717a);--accent:var(--doclang-accent,#2563eb);--placeholder-bg:var(--doclang-placeholder-bg,#fafafa);--font-ui:var(--doclang-font-ui,system-ui, -apple-system, \"Segoe UI\", sans-serif);--font-mono:var(--doclang-font-mono,ui-monospace, \"Cascadia Code\", \"Source Code Pro\", monospace);--markup-bg:var(--doclang-markup-bg,#fff);--markup-fg:var(--doclang-markup-fg,#24292e);--markup-hover:var(--doclang-markup-hover,#2563eb14);--markup-selected:var(--doclang-markup-selected,#2563eb24);--kind-text:var(--doclang-kind-text,#2563eb);--kind-heading:var(--doclang-kind-heading,#7c3aed);--kind-list:var(--doclang-kind-list,#ea580c);--kind-ldiv:var(--doclang-kind-ldiv,#ea580c);--kind-table:var(--doclang-kind-table,#16a34a);--kind-index:var(--doclang-kind-index,#0d9488);--kind-formula:var(--doclang-kind-formula,#0891b2);--kind-code:var(--doclang-kind-code,#475569);--kind-picture:var(--doclang-kind-picture,#db2777);--kind-group:var(--doclang-kind-group,#4f46e5);--kind-footnote:var(--doclang-kind-footnote,#a16207);--kind-page_header:var(--doclang-kind-page_header,#71717a);--kind-page_footer:var(--doclang-kind-page_footer,#71717a);--kind-caption:var(--doclang-kind-caption,#71717a);--kind-field:var(--doclang-kind-field,#d97706);--kind-default:var(--doclang-kind-default,#dc2626)}@media (prefers-color-scheme:dark){:host{--lightningcss-light: ;--lightningcss-dark:initial;--bg:var(--doclang-bg,#09090b);--panel:var(--doclang-panel,#18181b);--border:var(--doclang-border,#3f3f46);--text:var(--doclang-text,#fafafa);--muted:var(--doclang-muted,#a1a1aa);--placeholder-bg:var(--doclang-placeholder-bg,#27272a);--markup-bg:var(--doclang-markup-bg,#1e1e1e);--markup-fg:var(--doclang-markup-fg,#d4d4d4);--markup-hover:var(--doclang-markup-hover,#60a5fa1a);--markup-selected:var(--doclang-markup-selected,#60a5fa2e);--kind-text:var(--doclang-kind-text,#60a5fa);--kind-heading:var(--doclang-kind-heading,#a78bfa);--kind-list:var(--doclang-kind-list,#fb923c);--kind-ldiv:var(--doclang-kind-ldiv,#fb923c);--kind-table:var(--doclang-kind-table,#4ade80);--kind-index:var(--doclang-kind-index,#2dd4bf);--kind-formula:var(--doclang-kind-formula,#22d3ee);--kind-code:var(--doclang-kind-code,#94a3b8);--kind-picture:var(--doclang-kind-picture,#f472b6);--kind-group:var(--doclang-kind-group,#818cf8);--kind-footnote:var(--doclang-kind-footnote,#facc15);--kind-page_header:var(--doclang-kind-page_header,#a1a1aa);--kind-page_footer:var(--doclang-kind-page_footer,#a1a1aa);--kind-caption:var(--doclang-kind-caption,#a1a1aa);--kind-field:var(--doclang-kind-field,#fbbf24);--kind-default:var(--doclang-kind-default,#f87171)}}:host{border-right:1px solid var(--border);background:var(--panel);--xml-tag:var(--doclang-xml-tag,#116329);--xml-bracket:var(--doclang-xml-bracket,#24292e);--xml-attr-name:var(--doclang-xml-attr-name,#0550ae);--xml-attr-value:var(--doclang-xml-attr-value,#0a3069);--xml-text:var(--doclang-xml-text,#24292e);--xml-cdata:var(--doclang-xml-cdata,#6a737d);--xml-cdata-delimiter:var(--doclang-xml-cdata-delimiter,#6a737d);flex-direction:column;min-width:0;min-height:0;display:flex}:host([hidden]){display:none!important}:host(.pane-layout-last){border-right:none}.pane-header{box-sizing:border-box;letter-spacing:.04em;text-transform:uppercase;height:2.125rem;color:var(--muted);border-bottom:1px solid var(--border);background:var(--panel);align-items:center;gap:.5rem;padding:0 .75rem;font-size:.75rem;font-weight:600;display:flex}.pane-body{background:var(--markup-bg);min-height:0;color:var(--markup-fg);flex:1;padding:0;overflow:auto}.pane-body .placeholder{margin:1rem}.placeholder{min-height:12rem;color:var(--muted);background:var(--placeholder-bg);border:1px dashed var(--border);text-align:center;border-radius:.5rem;justify-content:center;align-items:center;padding:2rem;font-style:italic;display:flex}pre.markup{font-family:var(--font-mono);white-space:pre-wrap;word-break:break-word;margin:0;font-size:.8125rem;line-height:1.5}.markup{font-family:var(--font-mono);tab-size:2;--markup-indent:2ch;--markup-gutter-width:1rem;margin:0;padding:.75rem 1rem 1rem;font-size:.8125rem;line-height:1.55}.markup-ghost-tag-part{opacity:.35;cursor:help}.head-tooltip{border-collapse:collapse;width:100%;font-size:.6875rem;line-height:1.4}.head-tooltip th{color:var(--muted);text-align:left;vertical-align:top;white-space:nowrap;padding:.1rem .55rem .1rem 0;font-weight:600}.head-tooltip td{vertical-align:top;word-break:break-word;padding:.1rem 0}.head-tooltip .head-default{color:var(--muted);white-space:nowrap;font-style:italic}.markup-el{cursor:pointer;border-radius:.2rem}.markup-el:hover{background:var(--markup-hover)}.markup-el.selected{background:var(--markup-selected);box-shadow:inset 0 0 0 1px var(--accent)}.markup-line{white-space:pre-wrap;word-break:break-word;cursor:pointer;border-radius:.15rem;padding:0 .25rem}.markup-line-content{min-width:0;padding-left:calc(var(--markup-depth,0) * var(--markup-indent));align-items:baseline;display:flex}.markup-gutter{flex:0 0 var(--markup-gutter-width);width:var(--markup-gutter-width);justify-content:center;align-items:center;display:flex}.markup-line-body{flex:auto;min-width:0}summary::-webkit-details-marker{display:none}summary{list-style:none;display:block}summary:focus{outline:none}.markup-fold-toggle{appearance:none;width:var(--markup-gutter-width);height:1rem;color:var(--muted);cursor:pointer;background:0 0;border:none;border-radius:.15rem;flex-shrink:0;justify-content:center;align-items:center;margin:0;padding:0;display:inline-flex}.markup-fold-toggle:before{content:\"\";border-top:4px solid #0000;border-bottom:4px solid #0000;border-left:5px solid;width:0;height:0;transition:transform .12s;display:block;transform:rotate(90deg)}details:not([open])>summary .markup-fold-toggle:before{transform:rotate(0)}.markup-fold-toggle:hover{background:var(--markup-hover);color:var(--markup-fg)}.markup-fold-suffix{display:none}details:not([open])>summary .markup-fold-suffix{display:inline}details:not([open])>.markup-fold-body{display:none}.xml-tag{color:var(--xml-tag)}.xml-bracket{color:var(--xml-bracket)}.xml-attr-name{color:var(--xml-attr-name)}.xml-attr-value{color:var(--xml-attr-value)}.xml-attr-value-truncatable{display:inline}.xml-attr-value-chip{appearance:none;border:1px solid var(--border);background:var(--placeholder-bg);color:var(--muted);font-family:var(--font-ui,system-ui, sans-serif);cursor:pointer;vertical-align:baseline;white-space:nowrap;border-radius:.25rem;align-items:center;gap:.3em;margin:0 0 0 .35em;padding:.08em .45em .08em .5em;font-size:.72em;font-weight:600;line-height:1.35;display:inline-flex}.xml-attr-value-chip:after{content:\"\";opacity:.75;border-top:.28em solid;border-left:.22em solid #0000;border-right:.22em solid #0000;width:0;height:0;transition:transform .12s}.xml-attr-value-chip[aria-expanded=true]:after{transform:rotate(180deg)}.xml-attr-value-chip:hover,.xml-attr-value-chip[aria-expanded=true]{border-color:var(--accent);color:var(--accent);background:color-mix(in srgb, var(--accent) 8%, var(--placeholder-bg))}.markup-embedded-uri-panel{cursor:text}.markup-embedded-uri-panel:hover{background:0 0}.markup-embedded-uri-panel-body{max-height:8rem;color:var(--xml-attr-value);word-break:break-all;background:var(--placeholder-bg);border:1px solid var(--border);-webkit-user-select:text;user-select:text;border-radius:.25rem;margin:.1rem 0 .25rem;padding:.45rem .6rem;overflow:auto}.xml-text{color:var(--xml-text)}.xml-cdata{color:var(--xml-cdata)}.xml-cdata-delimiter{color:var(--xml-cdata-delimiter)}@media (prefers-color-scheme:dark){:host{--xml-tag:var(--doclang-xml-tag,#4ec9b0);--xml-bracket:var(--doclang-xml-bracket,gray);--xml-attr-name:var(--doclang-xml-attr-name,#9cdcfe);--xml-attr-value:var(--doclang-xml-attr-value,#ce9178);--xml-text:var(--doclang-xml-text,#d4d4d4);--xml-cdata:var(--doclang-xml-cdata,#b5cea8);--xml-cdata-delimiter:var(--doclang-xml-cdata-delimiter,gray)}}", tr = "DocLang virtual <text>; wrapping tags not included in source", nr = 30;
function rr(e) {
	return !e || e.length <= nr ? !1 : /^(data:image\/|blob:)/i.test(e);
}
function ir(e) {
	if (e < 1024) return `${e} B`;
	if (e < 1048576) {
		let t = e / 1024;
		return t < 10 ? `${t.toFixed(1)} KB` : `${Math.round(t)} KB`;
	}
	return `${(e / 1048576).toFixed(1)} MB`;
}
function ar(e) {
	if (/^blob:/i.test(e)) return e.length >= 1024 ? `${Math.round(e.length / 1024)} KB URL` : `${e.length} char URL`;
	let t = e.indexOf(",");
	if (t === -1) return "embedded data";
	let n = e.slice(0, t), r = e.slice(t + 1).replace(/\s/g, ""), i = /^data:([^;,]+)/i.exec(n)?.[1] ?? "";
	return `${i.startsWith("image/") ? i.slice(6) : i || "data"} · ${ir(Math.floor(r.replace(/=+$/, "").length * 3 / 4))}`;
}
function or(e) {
	for (let t = 0; t < e.length; t += 1) {
		let n = e[t];
		if (n && (P(n) && !F(n) || n.nodeType === Node.ELEMENT_NODE)) return !0;
	}
	return !1;
}
function sr(e) {
	if (F(e)) return !0;
	if (e.nodeType !== Node.ELEMENT_NODE) return !1;
	let t = L(e);
	return t === "location" || M.has(t);
}
function cr(e) {
	if (!or(e)) return !1;
	for (let t of e) if (!sr(t) && (P(t) || t.nodeType === Node.ELEMENT_NODE && !Ft(t))) return !0;
	return !1;
}
var lr = class extends U {
	constructor(...e) {
		super(...e), this._wheel = new $n(this, () => this.scrollPane), this._hasMarkup = null, this._markupTemplate = null, this._onBodyClick = (e) => {
			let t = e.target, n = t.closest(".xml-attr-value-chip");
			if (n) {
				e.stopPropagation(), this._toggleTruncatableMarkupAttrValue(n);
				return;
			}
			let r = t.closest(".markup-el-virtual-text"), i = r?.hasAttribute("data-element-id") ? r.getAttribute("data-element-id") : t.closest(".markup-el[data-element-id]")?.getAttribute("data-element-id") ?? null;
			i && this.dispatchEvent(new CustomEvent("doclang-element-select", {
				bubbles: !0,
				composed: !0,
				detail: { id: i }
			}));
		}, this._onSummaryClick = (e) => {
			let t = e.target;
			!t.closest(".markup-fold-toggle") && !t.closest(".markup-gutter") && e.preventDefault();
		};
	}
	static {
		this.styles = s(er);
	}
	connectedCallback() {
		super.connectedCallback(), this.classList.add("pane", "pane-markup");
	}
	render() {
		return b`<div class="pane-header">DocLang</div><div class="pane-body" id="markup-pane" @click=${this._onBodyClick}>${this._hasMarkup === !1 ? b`<div class="placeholder">${fn}</div>` : this._hasMarkup === !0 && this._markupTemplate ? b`<div class="markup">${this._markupTemplate}</div>` : C}</div>`;
	}
	get scrollPane() {
		return this.shadowRoot?.querySelector(".pane-body") ?? null;
	}
	_applySelection() {
		if (!this.shadowRoot) return;
		for (let e of this.shadowRoot.querySelectorAll(".markup-el.selected")) e.classList.remove("selected");
		if (!this.selected) return;
		let e = this.shadowRoot.querySelector(`.markup-el-virtual-text[data-element-id="${this.selected}"]`) ?? this.shadowRoot.querySelector(`[data-element-id="${this.selected}"]`);
		e && (e.classList.add("selected"), e.scrollIntoView({
			block: "nearest",
			behavior: "smooth"
		}));
	}
	_renderDocument() {
		let e = this._docState;
		if (!e) {
			this._markupTemplate = null, this._hasMarkup = null;
			return;
		}
		let t = e.segments[this.page - 1] ?? [], n = _n(t);
		e.elementIds = n, e.idToElement = vn(n), hn(t) ? (this._markupTemplate = this._buildMarkupView(t, n), this._hasMarkup = !0) : (this._markupTemplate = null, this._hasMarkup = !1), this.requestUpdate();
	}
	_clearDocument() {
		this._markupTemplate = null, this._hasMarkup = null, this.requestUpdate();
	}
	_buildMarkupView(e, t) {
		let n = [];
		for (let r of e) r.nodeType === Node.ELEMENT_NODE && n.push(this._renderMarkupElement(r, 0, t));
		return n;
	}
	_createEmbeddedUriContinuationPanel(e, t) {
		let n = document.createElement("div");
		return Ve(b`<div class="markup-line markup-embedded-uri-panel" style="--markup-depth: ${t}"><span class="markup-line-content"><span class="markup-gutter" aria-hidden="true"></span><span class="markup-line-body"><div class="markup-embedded-uri-panel-body" @click=${(e) => e.stopPropagation()}>${e}</div></span></span></div>`, n), n.firstElementChild;
	}
	_renderTruncatableMarkupAttrValue(e) {
		let t = ar(e);
		return b`<span class="xml-attr-value xml-attr-value-truncatable" data-full-value=${e}><span class="xml-attr-value-text">${e.slice(0, nr)}</span><button type="button" class="xml-attr-value-chip" data-collapsed-label=${t} aria-expanded="false" aria-label="Show full value (${t})"><span class="xml-attr-value-chip-label">${t}</span></button></span>`;
	}
	_toggleTruncatableMarkupAttrValue(e) {
		let t = e.closest(".xml-attr-value-truncatable");
		if (!t) return;
		let n = t.closest(".markup-line"), r = t.dataset.fullValue ?? "", i = e.querySelector(".xml-attr-value-chip-label"), a = e.dataset.collapsedLabel ?? i?.textContent ?? "";
		if (e.getAttribute("aria-expanded") === "true") {
			e.setAttribute("aria-expanded", "false"), e.setAttribute("aria-label", `Show full value (${a})`), i && (i.textContent = a), n?.nextElementSibling?.classList.contains("markup-embedded-uri-panel") && n.nextElementSibling.remove();
			return;
		}
		if (e.setAttribute("aria-expanded", "true"), e.setAttribute("aria-label", "Hide full value"), i && (i.textContent = "hide"), !n || n.nextElementSibling?.classList.contains("markup-embedded-uri-panel")) return;
		let o = Number(n.style.getPropertyValue("--markup-depth") || 0);
		n.insertAdjacentElement("afterend", this._createEmbeddedUriContinuationPanel(r, o));
	}
	_renderXmlSpan(e, t, { ghost: n = !1 } = {}) {
		return n ? b`<span class="${e} markup-ghost-tag-part" title=${tr}>${t}</span>` : b`<span class=${e}>${t}</span>`;
	}
	_renderMarkupLineRow(e, t, { foldToggle: n = !1 } = {}) {
		return b`<div class="markup-line" style="--markup-depth: ${e}"><span class="markup-line-content"><span class="markup-gutter" aria-hidden="true">${n ? b`<span class="markup-fold-toggle"></span>` : C}</span><span class="markup-line-body">${t}</span></span></div>`;
	}
	_renderMarkupAttrValue(e) {
		return rr(e) ? this._renderTruncatableMarkupAttrValue(e) : this._renderXmlSpan("xml-attr-value", e);
	}
	_renderMarkupAttributes(e) {
		return e.map(({ name: e, value: t }) => b` ${this._renderXmlSpan("xml-attr-name", e)}${this._renderXmlSpan("xml-bracket", "=\"")}${this._renderMarkupAttrValue(t)}${this._renderXmlSpan("xml-bracket", "\"")}`);
	}
	_renderMarkupTextContent(e) {
		let t = /^<!\[CDATA\[([\s\S]*)\]\]>$/.exec(e);
		return t ? b`${this._renderXmlSpan("xml-cdata-delimiter", "<![CDATA[")}${this._renderXmlSpan("xml-cdata", t[1] ?? "")}${this._renderXmlSpan("xml-cdata-delimiter", "]]>")}` : this._renderXmlSpan("xml-text", e);
	}
	_renderOpenTagContent(e, t, n = !1) {
		return b`${this._renderXmlSpan("xml-bracket", "<", { ghost: n })}${this._renderXmlSpan("xml-tag", e, { ghost: n })}${this._renderMarkupAttributes(t)}${this._renderXmlSpan("xml-bracket", ">", { ghost: n })}`;
	}
	_renderMarkupFoldableOpen(e, t, n, r) {
		let i = !!r, a = b`${this._renderOpenTagContent(t, n, i)}<span class="markup-fold-suffix">${this._renderXmlSpan("xml-bracket", "...", { ghost: i })}${this._renderXmlSpan("xml-bracket", "</", { ghost: i })}${this._renderXmlSpan("xml-tag", t, { ghost: i })}${this._renderXmlSpan("xml-bracket", ">", { ghost: i })}</span>`;
		return b`<summary class="markup-line markup-line-open" style="--markup-depth: ${e}" @click=${this._onSummaryClick}><span class="markup-line-content"><span class="markup-gutter" aria-hidden="true"><span class="markup-fold-toggle"></span></span><span class="markup-line-body">${a}</span></span></summary>`;
	}
	_renderMarkupCloseTag(e, t, n) {
		let r = !!n, i = b`${this._renderXmlSpan("xml-bracket", "</", { ghost: r })}${this._renderXmlSpan("xml-tag", t, { ghost: r })}${this._renderXmlSpan("xml-bracket", ">", { ghost: r })}`;
		return this._renderMarkupLineRow(e, i);
	}
	_renderMarkupSelfClosingTag(e, t, n) {
		let r = b`${this._renderXmlSpan("xml-bracket", "<")}${this._renderXmlSpan("xml-tag", t)}${this._renderMarkupAttributes(n)}${this._renderXmlSpan("xml-bracket", "/>")}`;
		return this._renderMarkupLineRow(e, r);
	}
	_renderMarkupInlineElement(e, t, n, r) {
		let i = b`${this._renderOpenTagContent(t, n)}${this._renderMarkupTextContent(r)}${this._renderXmlSpan("xml-bracket", "</")}${this._renderXmlSpan("xml-tag", t)}${this._renderXmlSpan("xml-bracket", ">")}`;
		return this._renderMarkupLineRow(e, i);
	}
	_renderMarkupTextLine(e, t) {
		return this._renderMarkupLineRow(e, this._renderMarkupTextContent(t));
	}
	_renderMarkupNodesFromSlice(e, t, n) {
		let r = [];
		for (let i = 0; i < t.length; i += 1) {
			let a = t[i];
			if (a) {
				if (P(a)) {
					let t = Dt(a);
					t && r.push(this._renderMarkupTextLine(e, t));
				} else a.nodeType === Node.ELEMENT_NODE && r.push(this._renderMarkupElement(a, e, n));
			}
		}
		return r;
	}
	_renderMarkupVirtualText(e, t, n, r) {
		return cr(n) ? b`<details class="markup-el markup-el-foldable markup-el-virtual-text" ?open=${!0} data-element-id=${r.get(t) ?? C}>${this._renderMarkupFoldableOpen(e, "text", [], tr)}<div class="markup-fold-body"><div class="markup-children">${this._renderMarkupNodesFromSlice(e + 1, n, r)}</div>${this._renderMarkupCloseTag(e, "text", tr)}</div></details>` : this._renderMarkupNodesFromSlice(e, n, r);
	}
	_renderMarkupFoldableElement(e, t, n, r) {
		let i = L(e);
		return b`<details class="markup-el markup-el-foldable" ?open=${!0} data-element-id=${n.get(e) ?? C}>${this._renderMarkupFoldableOpen(t, i, vt(e))}<div class="markup-fold-body"><div class="markup-children">${r(t + 1)}</div>${this._renderMarkupCloseTag(t, i)}</div></details>`;
	}
	_renderMarkupList(e, t, n) {
		return this._renderMarkupFoldableElement(e, t, n, (t) => {
			let r = [], i = [...e.childNodes], a = 0;
			for (; a < i.length;) {
				let e = i[a];
				if (!e) {
					a += 1;
					continue;
				}
				if (e.nodeType === Node.ELEMENT_NODE && L(e) === "ldiv") break;
				if (P(e) && F(e)) {
					a += 1;
					continue;
				}
				if (P(e)) break;
				if (e.nodeType === Node.ELEMENT_NODE) {
					let i = L(e);
					if (M.has(i) || i === "location") {
						r.push(this._renderMarkupElement(e, t, n)), a += 1;
						continue;
					}
				}
				break;
			}
			for (; a < i.length;) {
				let e = i[a];
				if (!e) {
					a += 1;
					continue;
				}
				if (e.nodeType !== Node.ELEMENT_NODE || L(e) !== "ldiv") {
					r.push(...this._renderMarkupNodesFromSlice(t, [e], n)), a += 1;
					continue;
				}
				let o = e;
				r.push(this._renderMarkupElement(o, t, n)), a += 1;
				let s = St(i, a);
				r.push(this._renderMarkupVirtualText(t, o, i.slice(a, s), n)), a = s;
			}
			return r;
		});
	}
	_renderMarkupOtslContainer(e, t, n) {
		return this._renderMarkupFoldableElement(e, t, n, (t) => {
			let r = [], i = [...e.childNodes], a = 0;
			for (; a < i.length;) {
				let e = i[a];
				if (!e) {
					a += 1;
					continue;
				}
				if (e.nodeType === Node.ELEMENT_NODE && B(L(e))) break;
				if (P(e) && F(e)) {
					a += 1;
					continue;
				}
				if (P(e)) break;
				if (e.nodeType === Node.ELEMENT_NODE) {
					let i = L(e);
					if (M.has(i) || i === "location" || i === "h_thread") {
						r.push(this._renderMarkupElement(e, t, n)), a += 1;
						continue;
					}
				}
				break;
			}
			for (; a < i.length;) {
				let e = i[a];
				if (!e) {
					a += 1;
					continue;
				}
				if (e.nodeType !== Node.ELEMENT_NODE) {
					r.push(...this._renderMarkupNodesFromSlice(t, [e], n)), a += 1;
					continue;
				}
				let o = L(e);
				if (o === "nl") {
					r.push(this._renderMarkupSelfClosingTag(t, "nl", [])), a += 1;
					continue;
				}
				if (!B(o)) {
					r.push(...this._renderMarkupNodesFromSlice(t, [e], n)), a += 1;
					continue;
				}
				let s = e;
				if (r.push(this._renderMarkupElement(s, t, n)), a += 1, _t.has(o)) continue;
				let c = Ct(i, a);
				r.push(this._renderMarkupVirtualText(t, s, i.slice(a, c), n)), a = c;
			}
			return r;
		});
	}
	_renderMarkupElement(e, t, n) {
		let r = L(e);
		if (r === "list") return this._renderMarkupList(e, t, n);
		if (N.has(r)) return this._renderMarkupOtslContainer(e, t, n);
		let i = n.get(e), a = vt(e);
		if (!e.childNodes.length) return b`<div class="markup-el" data-element-id=${i ?? C}>${this._renderMarkupSelfClosingTag(t, r, a)}</div>`;
		let o = [...e.childNodes].filter((e) => P(e) && !F(e));
		if (o.length > 0 && o.every(P) && !I(e).length) {
			let n = Ot(e.childNodes);
			if (n) return b`<div class="markup-el" data-element-id=${i ?? C}>${this._renderMarkupInlineElement(t, r, a, n)}</div>`;
		}
		return b`<details class="markup-el markup-el-foldable" ?open=${!0} data-element-id=${i ?? C}>${this._renderMarkupFoldableOpen(t, r, a)}<div class="markup-fold-body"><div class="markup-children">${[...e.childNodes].map((e) => {
			if (P(e)) {
				let n = Dt(e);
				return n ? this._renderMarkupTextLine(t + 1, n) : C;
			}
			return e.nodeType === Node.ELEMENT_NODE ? this._renderMarkupElement(e, t + 1, n) : C;
		})}</div>${this._renderMarkupCloseTag(t, r)}</div></details>`;
	}
};
H([O()], lr.prototype, "_hasMarkup", void 0), H([O()], lr.prototype, "_markupTemplate", void 0), lr = H([E("doclang-markup-pane")], lr);
//#endregion
//#region src/components/page-img-pane/page-img-pane.css?inline
var ur = ":host{--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark;--bg:var(--doclang-bg,#f4f4f5);--panel:var(--doclang-panel,#fff);--border:var(--doclang-border,#d4d4d8);--text:var(--doclang-text,#18181b);--muted:var(--doclang-muted,#71717a);--accent:var(--doclang-accent,#2563eb);--placeholder-bg:var(--doclang-placeholder-bg,#fafafa);--font-ui:var(--doclang-font-ui,system-ui, -apple-system, \"Segoe UI\", sans-serif);--font-mono:var(--doclang-font-mono,ui-monospace, \"Cascadia Code\", \"Source Code Pro\", monospace);--markup-bg:var(--doclang-markup-bg,#fff);--markup-fg:var(--doclang-markup-fg,#24292e);--markup-hover:var(--doclang-markup-hover,#2563eb14);--markup-selected:var(--doclang-markup-selected,#2563eb24);--kind-text:var(--doclang-kind-text,#2563eb);--kind-heading:var(--doclang-kind-heading,#7c3aed);--kind-list:var(--doclang-kind-list,#ea580c);--kind-ldiv:var(--doclang-kind-ldiv,#ea580c);--kind-table:var(--doclang-kind-table,#16a34a);--kind-index:var(--doclang-kind-index,#0d9488);--kind-formula:var(--doclang-kind-formula,#0891b2);--kind-code:var(--doclang-kind-code,#475569);--kind-picture:var(--doclang-kind-picture,#db2777);--kind-group:var(--doclang-kind-group,#4f46e5);--kind-footnote:var(--doclang-kind-footnote,#a16207);--kind-page_header:var(--doclang-kind-page_header,#71717a);--kind-page_footer:var(--doclang-kind-page_footer,#71717a);--kind-caption:var(--doclang-kind-caption,#71717a);--kind-field:var(--doclang-kind-field,#d97706);--kind-default:var(--doclang-kind-default,#dc2626)}@media (prefers-color-scheme:dark){:host{--lightningcss-light: ;--lightningcss-dark:initial;--bg:var(--doclang-bg,#09090b);--panel:var(--doclang-panel,#18181b);--border:var(--doclang-border,#3f3f46);--text:var(--doclang-text,#fafafa);--muted:var(--doclang-muted,#a1a1aa);--placeholder-bg:var(--doclang-placeholder-bg,#27272a);--markup-bg:var(--doclang-markup-bg,#1e1e1e);--markup-fg:var(--doclang-markup-fg,#d4d4d4);--markup-hover:var(--doclang-markup-hover,#60a5fa1a);--markup-selected:var(--doclang-markup-selected,#60a5fa2e);--kind-text:var(--doclang-kind-text,#60a5fa);--kind-heading:var(--doclang-kind-heading,#a78bfa);--kind-list:var(--doclang-kind-list,#fb923c);--kind-ldiv:var(--doclang-kind-ldiv,#fb923c);--kind-table:var(--doclang-kind-table,#4ade80);--kind-index:var(--doclang-kind-index,#2dd4bf);--kind-formula:var(--doclang-kind-formula,#22d3ee);--kind-code:var(--doclang-kind-code,#94a3b8);--kind-picture:var(--doclang-kind-picture,#f472b6);--kind-group:var(--doclang-kind-group,#818cf8);--kind-footnote:var(--doclang-kind-footnote,#facc15);--kind-page_header:var(--doclang-kind-page_header,#a1a1aa);--kind-page_footer:var(--doclang-kind-page_footer,#a1a1aa);--kind-caption:var(--doclang-kind-caption,#a1a1aa);--kind-field:var(--doclang-kind-field,#fbbf24);--kind-default:var(--doclang-kind-default,#f87171)}}:host{border-right:1px solid var(--border);background:var(--panel);--overlay-reading-order:var(--doclang-overlay-reading-order,#71717a);--overlay-fragment:var(--doclang-overlay-fragment,#9333ea);flex-direction:column;min-width:0;min-height:0;display:flex}:host([hidden]){display:none!important}:host(.pane-layout-last){border-right:none}.pane-header{box-sizing:border-box;letter-spacing:.04em;text-transform:uppercase;height:2.125rem;color:var(--muted);border-bottom:1px solid var(--border);background:var(--panel);justify-content:space-between;align-items:center;gap:.5rem;padding:0 .75rem;font-size:.75rem;font-weight:600;display:flex}.pane-header-title{min-width:0}.pane-page-controls{flex-shrink:0;align-items:center;gap:.5rem;display:flex}.page-zoom-control{-webkit-user-select:none;user-select:none;align-items:center;gap:.35rem;display:flex}.page-zoom-control-label{letter-spacing:.04em;text-transform:uppercase;color:var(--muted);cursor:pointer;font-size:.625rem;font-weight:600}.page-zoom-control input[type=range]{cursor:pointer;width:5.5rem;height:1rem;margin:0}.page-zoom-reset{appearance:none;border:1px solid var(--border);background:var(--bg);color:var(--muted);height:1.25rem;font:inherit;font-variant-numeric:tabular-nums;cursor:pointer;border-radius:.375rem;min-width:2.75rem;padding:0 .45rem;font-size:.6875rem;font-weight:600;line-height:1}.page-zoom-reset:not(:disabled):hover{border-color:var(--accent);color:var(--text)}.page-zoom-reset:disabled{opacity:.55;cursor:default}.pane-settings-toggle{appearance:none;color:var(--muted);cursor:pointer;white-space:nowrap;letter-spacing:.04em;text-transform:uppercase;height:1.25rem;font-size:.625rem;font-weight:600;line-height:1;font:inherit;background:0 0;border:1px solid #0000;border-radius:.25rem;flex-shrink:0;align-items:center;padding:0 .28rem 0 .4rem;transition:color .12s,background .12s,border-color .12s;display:inline-flex}.pane-settings-toggle:after{content:\"\";opacity:.65;border-bottom:1.5px solid;border-right:1.5px solid;flex-shrink:0;width:.26rem;height:.26rem;margin-top:-.1em;margin-left:.22rem;transform:rotate(45deg)}.pane-settings-toggle:hover{color:var(--text);background:color-mix(in srgb, var(--text) 5%, transparent)}.pane-settings-toggle[aria-expanded=true]{color:var(--accent);background:color-mix(in srgb, var(--accent) 10%, var(--panel));border-color:color-mix(in srgb, var(--accent) 22%, transparent)}.pane-settings-toggle:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.pane-page-layout{flex-direction:column;flex:1;min-width:0;min-height:0;display:flex;position:relative}.pane-body{flex-direction:column;flex:auto;min-width:0;min-height:0;padding:.75rem;display:flex;overflow:hidden}.settings-option{cursor:pointer;-webkit-user-select:none;user-select:none;align-items:flex-start;gap:.5rem;font-size:.875rem;display:flex}.settings-option-primary+.settings-subgroup{margin-top:.65rem}.settings-option-primary{font-weight:600}.settings-subgroup{flex-direction:column;gap:.5rem;padding-left:.85rem;display:flex}.settings-reading-order-group{gap:.35rem;padding-left:1.6rem}.settings-option-nested{padding-left:0}.settings-option-sub{color:var(--muted);font-size:.8125rem}.settings-option-disabled{opacity:.45;cursor:not-allowed}.settings-option-disabled input{cursor:not-allowed}.settings-option input{cursor:pointer;flex-shrink:0;margin:.15rem 0 0}.settings-divider{background:var(--border);height:1px;margin:.75rem 0}.arrow-layer-row{justify-content:space-between;align-items:flex-start;gap:.375rem;display:flex}.arrow-layer-row .settings-option{flex:auto;min-width:0}.arrow-layer-row .settings-option span{white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.arrow-style-btn{appearance:none;width:1.25rem;height:.9rem;color:var(--muted);cursor:pointer;background:0 0;border:none;border-radius:.25rem;flex:none;justify-content:center;align-items:center;margin:.1rem 0 0;padding:0;display:flex}.arrow-style-btn:before{content:\"\";border-top:.3rem solid #0000;border-bottom:.3rem solid #0000;border-left:.3rem solid;width:0;height:0;transition:transform .12s}.arrow-style-btn:hover{background:var(--bg);color:var(--text)}.arrow-style-btn[aria-expanded=true]{color:var(--text)}.arrow-style-btn[aria-expanded=true]:before{transform:rotate(90deg)}.arrow-layer-row.is-disabled .arrow-style-btn{opacity:.45;pointer-events:none}.arrow-style-fields{flex-direction:column;gap:.4rem;padding:.35rem 0 .55rem 1.6rem;display:flex}.settings-reading-order-group .arrow-style-fields{padding-left:.4rem}.arrow-style-fields[hidden]{display:none}.arrow-style-fields label{color:var(--muted);cursor:default;justify-content:space-between;align-items:center;gap:.5rem;font-size:.75rem;display:flex}.arrow-field-control{flex:auto;justify-content:flex-end;align-items:center;gap:.35rem;min-width:0;display:flex}.arrow-field-value{text-align:right;min-width:1.5rem;color:var(--text);font-variant-numeric:tabular-nums;flex:none}.arrow-style-fields input[type=range]{cursor:pointer;flex:auto;min-width:0;max-width:3.5rem}.arrow-style-fields input[type=color]{border:1px solid var(--border);cursor:pointer;background:0 0;border-radius:.25rem;width:2.25rem;height:1.4rem;padding:0}.arrow-style-fields select{font:inherit;color:var(--text);background:var(--panel);border:1px solid var(--border);cursor:pointer;border-radius:.25rem;padding:.1rem .25rem;font-size:.75rem}.overlays-reset{font:inherit;color:var(--text);border:1px solid var(--border);cursor:pointer;background:0 0;border-radius:.25rem;margin-top:.6rem;padding:.3rem .55rem;font-size:.75rem}.overlays-reset:hover{background:var(--bg)}.page-view-port{scrollbar-gutter:stable;flex:auto;width:100%;min-width:0;height:100%;min-height:0;display:flex;overflow:auto}.pane-body.can-pan{cursor:grab}.pane-body.is-panning{cursor:grabbing;-webkit-user-select:none;user-select:none}.pane-body:focus{outline:none}.pane-body:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}.placeholder{min-height:12rem;color:var(--muted);background:var(--placeholder-bg);border:1px dashed var(--border);text-align:center;border-radius:.5rem;justify-content:center;align-items:center;padding:2rem;font-style:italic;display:flex}.page-view{border:1px solid var(--border);border-radius:.25rem;flex-shrink:0;width:fit-content;margin:auto;line-height:0;display:block;position:relative;overflow:hidden}.page-view img{border:none;border-radius:0;width:auto;max-width:none;height:auto;max-height:none;display:block}.page-view img:not([data-layout-ready]){opacity:0}.page-view svg.overlay{pointer-events:auto;width:100%;height:100%;position:absolute;top:0;left:0;overflow:hidden}.overlay rect.bbox.bbox-hidden,.overlay .overlay-badge.bbox-hidden{display:none}.overlay rect.bbox{stroke-width:2px;vector-effect:non-scaling-stroke;pointer-events:none}.kind-text{--doclang-kind-stroke:var(--kind-text)}.kind-heading{--doclang-kind-stroke:var(--kind-heading)}.kind-list{--doclang-kind-stroke:var(--kind-list)}.kind-ldiv{--doclang-kind-stroke:var(--kind-ldiv)}.kind-table{--doclang-kind-stroke:var(--kind-table)}.kind-index{--doclang-kind-stroke:var(--kind-index)}.kind-formula{--doclang-kind-stroke:var(--kind-formula)}.kind-code{--doclang-kind-stroke:var(--kind-code)}.kind-picture{--doclang-kind-stroke:var(--kind-picture)}.kind-group{--doclang-kind-stroke:var(--kind-group)}.kind-footnote{--doclang-kind-stroke:var(--kind-footnote)}.kind-page_header{--doclang-kind-stroke:var(--kind-page_header)}.kind-page_footer{--doclang-kind-stroke:var(--kind-page_footer)}.kind-caption{--doclang-kind-stroke:var(--kind-caption)}.kind-field{--doclang-kind-stroke:var(--kind-field)}.kind-default{--doclang-kind-stroke:var(--kind-default)}.overlay rect.bbox.selected{stroke-width:3.5px;filter:drop-shadow(0 0 3px color-mix(in srgb, var(--kind-stroke,var(--accent)) 60%, transparent));fill:color-mix(in srgb, var(--kind-stroke,var(--accent)) 30%, transparent)!important}.overlay rect.bbox.related:not(.selected){fill:color-mix(in srgb, var(--kind-stroke,var(--accent)) 30%, transparent)!important}.overlay rect.bbox.layer-furniture,.overlay rect.bbox.layer-background{stroke:color-mix(in srgb, var(--kind-stroke,var(--muted)) 50%, transparent);fill:url(#layer-hatch)!important}.overlay .layer-hatch-stripe{fill:var(--muted);fill-opacity:.06}.overlay rect.bbox.layer-furniture.selected,.overlay rect.bbox.layer-background.selected{fill:color-mix(in srgb, var(--kind-stroke,var(--accent)) 22%, transparent)!important}.overlay rect.bbox.layer-furniture.related:not(.selected),.overlay rect.bbox.layer-background.related:not(.selected){fill:color-mix(in srgb, var(--kind-stroke,var(--accent)) 18%, transparent)!important}.overlay .bbox-text{fill:color-mix(in srgb, var(--kind-text) 14%, transparent);stroke:var(--kind-text)}.overlay .bbox-heading{fill:color-mix(in srgb, var(--kind-heading) 14%, transparent);stroke:var(--kind-heading)}.overlay .bbox-list,.overlay .bbox-ldiv{fill:color-mix(in srgb, var(--kind-list) 14%, transparent);stroke:var(--kind-list)}.overlay .bbox-table{fill:color-mix(in srgb, var(--kind-table) 14%, transparent);stroke:var(--kind-table)}.overlay .bbox-index{fill:color-mix(in srgb, var(--kind-index) 14%, transparent);stroke:var(--kind-index)}.overlay .bbox-formula{fill:color-mix(in srgb, var(--kind-formula) 14%, transparent);stroke:var(--kind-formula)}.overlay .bbox-code{fill:color-mix(in srgb, var(--kind-code) 16%, transparent);stroke:var(--kind-code)}.overlay .bbox-picture{fill:color-mix(in srgb, var(--kind-picture) 14%, transparent);stroke:var(--kind-picture)}.overlay .bbox-group{fill:color-mix(in srgb, var(--kind-group) 14%, transparent);stroke:var(--kind-group)}.overlay .bbox-footnote{fill:color-mix(in srgb, var(--kind-footnote) 14%, transparent);stroke:var(--kind-footnote)}.overlay .bbox-page_header,.overlay .bbox-page_footer{fill:color-mix(in srgb, var(--kind-page_header) 14%, transparent);stroke:var(--kind-page_header)}.overlay .bbox-caption{fill:color-mix(in srgb, var(--kind-caption) 14%, transparent);stroke:var(--kind-caption)}.overlay line.caption-link{color:var(--arrow-caption-color,var(--kind-caption));stroke:currentColor;stroke-width:var(--arrow-caption-width,1.5);stroke-dasharray:var(--arrow-caption-dash,none);stroke-linecap:var(--arrow-caption-cap,butt);vector-effect:non-scaling-stroke;pointer-events:none;fill:none}.overlay line.caption-link.bbox-hidden{display:none}.overlay line.xref-link{color:var(--arrow-xref-color,var(--kind-footnote));stroke:currentColor;stroke-width:var(--arrow-xref-width,1.5);stroke-dasharray:var(--arrow-xref-dash,none);stroke-linecap:var(--arrow-xref-cap,butt);vector-effect:non-scaling-stroke;pointer-events:none;fill:none}.overlay line.xref-link.bbox-hidden{display:none}.overlay .fragment-link{pointer-events:none}.overlay .fragment-link.bbox-hidden{display:none}.overlay .fragment-link-path{color:var(--arrow-fragment-color,var(--overlay-fragment));fill:none;stroke:currentColor;stroke-width:var(--arrow-fragment-width,1.5);stroke-linecap:var(--arrow-fragment-cap,butt);vector-effect:non-scaling-stroke}.overlay .fragment-link-path-dashed{stroke-dasharray:var(--arrow-fragment-dash,6 4)}.overlay .fragment-nav{pointer-events:none}.overlay .fragment-nav.bbox-hidden{display:none}.overlay .fragment-nav-btn{pointer-events:auto;cursor:pointer}.overlay .fragment-nav-btn-disabled{pointer-events:none;cursor:default;opacity:.35}.overlay .fragment-nav-btn-bg{fill:var(--panel);stroke:var(--overlay-fragment);stroke-width:1px;vector-effect:non-scaling-stroke}.overlay .fragment-nav-btn-label{fill:var(--overlay-fragment);font-family:var(--font-ui);text-anchor:middle;dominant-baseline:central;pointer-events:none;font-weight:700}.overlay .fragment-nav-btn:not(.fragment-nav-btn-disabled):hover .fragment-nav-btn-bg{fill:color-mix(in srgb, var(--overlay-fragment) 12%, var(--panel))}.overlay .fragment-link-label{fill:var(--overlay-fragment);font-family:var(--font-ui);text-anchor:middle;dominant-baseline:middle;paint-order:stroke fill;stroke:var(--panel);stroke-width:3px;font-style:italic;font-weight:600}.overlay .reading-order-step{color:var(--arrow-reading-order-color,var(--overlay-reading-order));stroke:currentColor;stroke-width:var(--arrow-reading-order-width,1.5);stroke-dasharray:var(--arrow-reading-order-dash,5 4);stroke-linecap:var(--arrow-reading-order-cap,butt);vector-effect:non-scaling-stroke;pointer-events:none;fill:none}.overlay .reading-order-step.bbox-hidden,.overlay .reading-order-badge.bbox-hidden{display:none}.overlay .overlay-badge{pointer-events:none}.overlay .overlay-badge-bg{fill-opacity:1;stroke:none}.reading-order-badge .overlay-badge-bg{fill:var(--overlay-reading-order)}.overlay .element-badge{opacity:.8;pointer-events:auto;cursor:help}.overlay .element-badge .overlay-badge-bg{fill:var(--accent)}.overlay .element-badge.kind-text .overlay-badge-bg{fill:var(--kind-text)}.overlay .element-badge.kind-heading .overlay-badge-bg{fill:var(--kind-heading)}.overlay .element-badge.kind-list .overlay-badge-bg{fill:var(--kind-list)}.overlay .element-badge.kind-table .overlay-badge-bg{fill:var(--kind-table)}.overlay .element-badge.kind-index .overlay-badge-bg{fill:var(--kind-index)}.overlay .element-badge.kind-formula .overlay-badge-bg{fill:var(--kind-formula)}.overlay .element-badge.kind-code .overlay-badge-bg{fill:var(--kind-code)}.overlay .element-badge.kind-picture .overlay-badge-bg{fill:var(--kind-picture)}.overlay .element-badge.kind-group .overlay-badge-bg{fill:var(--kind-group)}.overlay .element-badge.kind-footnote .overlay-badge-bg{fill:var(--kind-footnote)}.overlay .element-badge.kind-page_header .overlay-badge-bg{fill:var(--kind-page_header)}.overlay .element-badge.kind-caption .overlay-badge-bg{fill:var(--kind-caption)}.overlay .element-badge.kind-field .overlay-badge-bg{fill:var(--kind-field)}.overlay .overlay-badge-label{fill:#fff;fill-opacity:1;font-family:var(--font-ui);text-anchor:middle;dominant-baseline:central;pointer-events:none;font-weight:700}.overlay .bbox-field{fill:color-mix(in srgb, var(--kind-field) 14%, transparent);stroke:var(--kind-field)}.overlay .bbox-default{fill:color-mix(in srgb, var(--kind-default) 12%, transparent);stroke:var(--kind-default)}@media (prefers-color-scheme:dark){:host{--overlay-reading-order:var(--doclang-overlay-reading-order,#a1a1aa);--overlay-fragment:var(--doclang-overlay-fragment,#c084fc)}.overlay .bbox-text{fill:color-mix(in srgb, var(--kind-text) 20%, transparent)}.overlay .bbox-heading{fill:color-mix(in srgb, var(--kind-heading) 20%, transparent)}.overlay .bbox-list,.overlay .bbox-ldiv{fill:color-mix(in srgb, var(--kind-list) 20%, transparent)}.overlay .bbox-table{fill:color-mix(in srgb, var(--kind-table) 18%, transparent)}.overlay .bbox-index{fill:color-mix(in srgb, var(--kind-index) 18%, transparent)}.overlay .bbox-formula{fill:color-mix(in srgb, var(--kind-formula) 18%, transparent)}.overlay .bbox-code{fill:color-mix(in srgb, var(--kind-code) 20%, transparent)}.overlay .bbox-picture{fill:color-mix(in srgb, var(--kind-picture) 20%, transparent)}.overlay .bbox-group{fill:color-mix(in srgb, var(--kind-group) 20%, transparent)}.overlay .bbox-footnote{fill:color-mix(in srgb, var(--kind-footnote) 18%, transparent)}.overlay .bbox-page_header,.overlay .bbox-page_footer{fill:color-mix(in srgb, var(--kind-page_header) 18%, transparent)}.overlay .bbox-caption{fill:color-mix(in srgb, var(--kind-caption) 18%, transparent)}.overlay .bbox-field{fill:color-mix(in srgb, var(--kind-field) 18%, transparent)}.overlay .bbox-default{fill:color-mix(in srgb, var(--kind-default) 18%, transparent)}}.page-view-hint{inset:unset;background:var(--panel);border:1px solid var(--border);width:max-content;max-width:24rem;color:var(--text);font-family:var(--font-ui);text-align:left;white-space:normal;pointer-events:none;border-radius:.25rem;margin:0;padding:.45rem .55rem;font-size:.75rem;line-height:1.35;position:fixed;top:0;left:0;box-shadow:0 2px 8px #0000001f}.page-view-hint .head-tooltip{border-collapse:collapse;width:100%;font-size:.6875rem;line-height:1.4}.page-view-hint .head-tooltip th{color:var(--muted);text-align:left;vertical-align:top;white-space:nowrap;padding:.1rem .55rem .1rem 0;font-weight:600}.page-view-hint .head-tooltip td{vertical-align:top;word-break:break-word;padding:.1rem 0}.page-view-hint .head-tooltip .head-default{color:var(--muted);white-space:nowrap;font-style:italic}", dr = ":host{--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark;--bg:var(--doclang-bg,#f4f4f5);--panel:var(--doclang-panel,#fff);--border:var(--doclang-border,#d4d4d8);--text:var(--doclang-text,#18181b);--muted:var(--doclang-muted,#71717a);--accent:var(--doclang-accent,#2563eb);--placeholder-bg:var(--doclang-placeholder-bg,#fafafa);--font-ui:var(--doclang-font-ui,system-ui, -apple-system, \"Segoe UI\", sans-serif);--font-mono:var(--doclang-font-mono,ui-monospace, \"Cascadia Code\", \"Source Code Pro\", monospace);--markup-bg:var(--doclang-markup-bg,#fff);--markup-fg:var(--doclang-markup-fg,#24292e);--markup-hover:var(--doclang-markup-hover,#2563eb14);--markup-selected:var(--doclang-markup-selected,#2563eb24);--kind-text:var(--doclang-kind-text,#2563eb);--kind-heading:var(--doclang-kind-heading,#7c3aed);--kind-list:var(--doclang-kind-list,#ea580c);--kind-ldiv:var(--doclang-kind-ldiv,#ea580c);--kind-table:var(--doclang-kind-table,#16a34a);--kind-index:var(--doclang-kind-index,#0d9488);--kind-formula:var(--doclang-kind-formula,#0891b2);--kind-code:var(--doclang-kind-code,#475569);--kind-picture:var(--doclang-kind-picture,#db2777);--kind-group:var(--doclang-kind-group,#4f46e5);--kind-footnote:var(--doclang-kind-footnote,#a16207);--kind-page_header:var(--doclang-kind-page_header,#71717a);--kind-page_footer:var(--doclang-kind-page_footer,#71717a);--kind-caption:var(--doclang-kind-caption,#71717a);--kind-field:var(--doclang-kind-field,#d97706);--kind-default:var(--doclang-kind-default,#dc2626)}@media (prefers-color-scheme:dark){:host{--lightningcss-light: ;--lightningcss-dark:initial;--bg:var(--doclang-bg,#09090b);--panel:var(--doclang-panel,#18181b);--border:var(--doclang-border,#3f3f46);--text:var(--doclang-text,#fafafa);--muted:var(--doclang-muted,#a1a1aa);--placeholder-bg:var(--doclang-placeholder-bg,#27272a);--markup-bg:var(--doclang-markup-bg,#1e1e1e);--markup-fg:var(--doclang-markup-fg,#d4d4d4);--markup-hover:var(--doclang-markup-hover,#60a5fa1a);--markup-selected:var(--doclang-markup-selected,#60a5fa2e);--kind-text:var(--doclang-kind-text,#60a5fa);--kind-heading:var(--doclang-kind-heading,#a78bfa);--kind-list:var(--doclang-kind-list,#fb923c);--kind-ldiv:var(--doclang-kind-ldiv,#fb923c);--kind-table:var(--doclang-kind-table,#4ade80);--kind-index:var(--doclang-kind-index,#2dd4bf);--kind-formula:var(--doclang-kind-formula,#22d3ee);--kind-code:var(--doclang-kind-code,#94a3b8);--kind-picture:var(--doclang-kind-picture,#f472b6);--kind-group:var(--doclang-kind-group,#818cf8);--kind-footnote:var(--doclang-kind-footnote,#facc15);--kind-page_header:var(--doclang-kind-page_header,#a1a1aa);--kind-page_footer:var(--doclang-kind-page_footer,#a1a1aa);--kind-caption:var(--doclang-kind-caption,#a1a1aa);--kind-field:var(--doclang-kind-field,#fbbf24);--kind-default:var(--doclang-kind-default,#f87171)}}:host{display:contents}.settings-layer{z-index:5;position:absolute;inset:0}.settings-scrim{z-index:0;appearance:none;background:color-mix(in srgb, var(--bg) 28%, transparent);cursor:default;border:none;margin:0;padding:0;position:absolute;inset:0}.settings-panel{z-index:1;border:1px solid var(--border);background:var(--panel);border-radius:.5rem;flex-direction:column;width:13rem;min-height:0;max-height:calc(100% - 1rem);display:flex;position:absolute;top:.5rem;right:.5rem;overflow:hidden;box-shadow:0 4px 20px #00000024}.settings-header{border-bottom:1px solid var(--border);justify-content:space-between;align-items:center;gap:.5rem;padding:.5rem .75rem;display:flex}.settings-title{letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin:0;font-size:.6875rem;font-weight:600}.settings-close{appearance:none;color:var(--muted);cursor:pointer;background:0 0;border:none;border-radius:.25rem;width:1.5rem;height:1.5rem;font-size:1.1rem;line-height:1}.settings-close:hover{color:var(--text);background:var(--bg)}.settings-body{padding:.75rem;overflow:auto}", fr = class extends T {
	constructor(...e) {
		super(...e), this.label = "", this._open = !1, this._titleId = `settings-title-${Math.random().toString(36).slice(2)}`, this._onClose = () => {
			this.setOpen(!1);
		}, this._onDocKeydown = (e) => {
			this._open && e.key === "Escape" && this.setOpen(!1);
		};
	}
	static {
		this.styles = s(dr);
	}
	connectedCallback() {
		super.connectedCallback(), document.addEventListener("keydown", this._onDocKeydown);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), document.removeEventListener("keydown", this._onDocKeydown);
	}
	render() {
		return this._open ? b`
      <div class="settings-layer">
        <button
          type="button"
          class="settings-scrim"
          tabindex="-1"
          aria-label="Close ${this.label}"
          @click=${this._onClose}
        ></button>
        <aside
          class="settings-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby=${this._titleId}
        >
          <div class="settings-header">
            <h2 class="settings-title" id=${this._titleId}>${this.label}</h2>
            <button
              type="button"
              class="settings-close"
              aria-label="Close ${this.label}"
              @click=${this._onClose}
            >
              ×
            </button>
          </div>
          <div class="settings-body">
            <slot></slot>
          </div>
        </aside>
      </div>
    ` : C;
	}
	setOpen(e) {
		this._open !== e && (this._open = e, this.requestUpdate(), e || this.dispatchEvent(new CustomEvent("doclang-settings-close", {
			bubbles: !0,
			composed: !0
		})));
	}
	get isOpen() {
		return this._open;
	}
};
H([D({ type: String })], fr.prototype, "label", void 0), fr = H([E("doclang-settings-panel")], fr);
//#endregion
//#region src/components/page-img-pane/overlay.ts
var pr = 16.5 * .8, mr = 3, hr = 2, gr = 3, _r = 1224, vr = 1584, yr = "Previous fragment", br = "Next fragment", xr = "cross-page content", Sr = "fragmented content", Cr = {
	readingOrder: {
		cssKey: "reading-order",
		colorVar: "--overlay-reading-order",
		markerId: "reading-order-arrowhead",
		defaultStyle: "dashed"
	},
	fragment: {
		cssKey: "fragment",
		colorVar: "--overlay-fragment",
		markerId: "fragment-arrowhead",
		defaultStyle: "dashed"
	},
	xref: {
		cssKey: "xref",
		colorVar: "--kind-footnote",
		markerId: "xref-arrowhead",
		defaultStyle: "solid"
	},
	caption: {
		cssKey: "caption",
		colorVar: "--kind-caption",
		markerId: "caption-arrowhead",
		defaultStyle: "solid"
	}
}, wr = {
	width: 1.5,
	head: 5
}, Tr = {
	solid: "none",
	dashed: "6 4",
	dotted: "1.5 3.5"
};
function Er(e) {
	return e.startsWith("field_") || e === "key" || e === "value" || e === "hint" ? "field" : e === "tabular" ? "table" : (/* @__PURE__ */ new Set([
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
	])).has(e) ? e : "default";
}
function Dr(e) {
	return `kind-${Er(e)}`;
}
function Or(e) {
	return Er(e);
}
function kr(e) {
	let t = getComputedStyle(e), n = parseFloat(t.paddingLeft) + parseFloat(t.paddingRight), r = parseFloat(t.paddingTop) + parseFloat(t.paddingBottom);
	return {
		w: e.clientWidth - n,
		h: e.clientHeight - r
	};
}
function Ar(e, t, n) {
	let { w: r, h: i } = kr(t), a = e.naturalWidth, o = e.naturalHeight, s = n.layoutCache;
	if (s && s.paneW === r && s.paneH === i && s.imgW === a && s.imgH === o) return s.fitScale;
	let c = r > 0 && i > 0 && a > 0 && o > 0 ? Math.min((r - 2) / a, (i - 2) / o) : 1;
	return n.setLayoutCache({
		paneW: r,
		paneH: i,
		imgW: a,
		imgH: o,
		fitScale: c
	}), c;
}
function G(e, t, n) {
	let r = n ?? t.pane.querySelector(".page-view img"), i = t.zoomPct / 100;
	if (!(i > 0)) return e;
	let { pane: a } = t;
	if (!r?.naturalWidth || !r.naturalHeight) return e / i;
	let { w: o, h: s } = kr(a);
	if (!(o > 0 && s > 0)) return e / i;
	let c = Math.min((o - 2) / _r, (s - 2) / vr), l = Ar(r, a, t);
	return !(c > 0) || !(l > 0) ? e / i : e * c / (l * i);
}
function jr(e, t, n) {
	if (!e?.naturalWidth || !e.naturalHeight) return !1;
	let r = Math.max(100, n.zoomPct), i = Ar(e, t, n) * (r / 100), a = Math.floor(e.naturalWidth * i), o = Math.floor(e.naturalHeight * i), s = `${a}px`, c = `${o}px`, l = e.style.width === s && e.style.height === c;
	return l || (e.style.width = s, e.style.height = c, e.style.maxWidth = "none", e.style.maxHeight = "none"), e.dataset.layoutReady = "1", !l;
}
function K(e, t) {
	let n = e.x0 / e.resW * t.naturalWidth, r = e.y0 / e.resH * t.naturalHeight, i = (e.x1 - e.x0) / e.resW * t.naturalWidth, a = (e.y1 - e.y0) / e.resH * t.naturalHeight;
	return {
		x: n,
		y: r,
		w: i,
		h: a,
		area: i * a
	};
}
function q(e) {
	return {
		x: e.x + e.w / 2,
		y: e.y + e.h / 2
	};
}
function Mr(e, t) {
	let n = (e) => e === "background" ? 0 : e === "furniture" ? 1 : 2, r = (e) => e.kind === "text" ? 0 : e.kind === "list" || e.kind === "table" || e.kind === "index" || e.kind === "tabular" ? 2 : 1;
	return [...e].sort((e, i) => {
		let a = n(e.layer ?? "body") - n(i.layer ?? "body");
		if (a !== 0) return a;
		let o = r(e) - r(i);
		if (o !== 0) return o;
		if (t) {
			let n = e.elementId === t;
			if (n !== (i.elementId === t)) return n ? 1 : -1;
		}
		return 0;
	});
}
function Nr(e, t) {
	let n = Math.hypot(t.x - e.x, t.y - e.y);
	if (!n) return {
		strokeDasharray: "",
		strokeDashoffset: ""
	};
	let r = n % 10;
	return {
		strokeDasharray: "6 4",
		strokeDashoffset: r > .01 ? String(r) : ""
	};
}
function Pr(e, t = {}) {
	let n = t.size ?? wr.head;
	return x`
    <marker id=${e} viewBox="0 0 6 6"
      refX="6" refY="3"
      markerWidth=${n} markerHeight=${n}
      orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill=${t.color || "currentColor"}></path>
    </marker>`;
}
function Fr(e, t, n, r) {
	let i = G(mr, r), a = G(hr, r), o = document.createElementNS("http://www.w3.org/2000/svg", "text");
	o.setAttribute("class", "overlay-badge-label"), o.setAttribute("font-size", String(n)), o.setAttribute("font-weight", "700"), o.setAttribute("text-anchor", "start"), o.setAttribute("dominant-baseline", "text-before-edge"), o.setAttribute("visibility", "hidden"), o.textContent = String(t), e.appendChild(o);
	let s, c;
	try {
		let e = o.getBBox();
		s = e.width + i * 2, c = e.height + a * 2;
	} catch {
		s = G(String(t).length * pr * .55 + 6, r), c = G(18.520000000000003, r);
	}
	return o.remove(), {
		width: s,
		height: c
	};
}
function Ir(e, t, n, r, i, a, o) {
	let s = G(pr, o), { width: c, height: l } = Fr(e, r, s, o), u = G(gr, o);
	return x`
    <g class=${`overlay-badge ${i}`} data-element-id=${a}>
      <rect class="overlay-badge-bg"
        x=${t - c / 2} y=${n - l / 2}
        width=${c} height=${l}
        rx=${u} ry=${u}></rect>
      <text class="overlay-badge-label"
        x=${t} y=${n}
        font-size=${s}>${r}</text>
    </g>`;
}
function Lr(e, t, n) {
	let r = t.captionBox ?? t.fromBox, i = t.hostBox ?? t.toBox, a = q(K(r, e)), o = q(K(i, e)), s = t.captionElementId ?? t.fromElementId, c = t.hostElementId ?? t.toElementId;
	return x`
    <line
      class=${n.linkClass}
      x1=${a.x} y1=${a.y}
      x2=${o.x} y2=${o.y}
      marker-end=${`url(#${n.markerId})`}
      ${n.fromIdAttr}=${s}
      ${n.toIdAttr}=${c}
    ></line>`;
}
function Rr(e, t, n, r, i, a, o, s) {
	let c = a === "prev" ? yr : br;
	return x`
    <g class=${`fragment-nav-btn fragment-nav-btn-${a}${s ? "" : " fragment-nav-btn-disabled"}`} data-nav=${a}
      role=${s ? "button" : ""}
      aria-label=${s ? c : ""}
    >
      ${s ? x`<title>${c}</title>` : ""}
      <rect class="fragment-nav-btn-bg"
        x=${e} y=${t} width=${n} height=${n}
        rx=${r} ry=${r}></rect>
      <text class="fragment-nav-btn-label"
        x=${e + n / 2} y=${t + n / 2}
        font-size=${i}>${o}</text>
    </g>`;
}
function zr(e, t) {
	let { img: n, boxes: r, captionLinks: i = [], xrefLinks: a = [], readingOrderSteps: o = [], fragmentLinks: s = [], fragmentNavItems: c = [], showAllBboxes: l, showLayoutBadges: u, showReadingOrder: d, ctx: f } = t, p = (e) => f.arrowMarkerOptions ? f.arrowMarkerOptions(e) : {}, m = [];
	if (n.naturalWidth) {
		let t = G(pr, f), i = G(2, f), a = new Map(l && d ? o.map((e) => [e.elementId, e]) : []);
		for (let o of Mr(r, f.selectedId)) {
			let { x: r, y: s } = K(o, n), c = { width: 0 };
			l && u && (c = Fr(e, o.tag, t, f), m.push(Ir(e, r, s, o.tag, `element-badge ${Dr(o.kind)}`, o.elementId, f)));
			let d = a.get(o.elementId);
			if (d) {
				let n = String(d.order), a = Fr(e, n, t, f), p = l && u ? r + c.width / 2 + i + a.width / 2 : r;
				m.push(Ir(e, p, s, n, "reading-order-badge", o.elementId, f));
			}
		}
	}
	let ee = s.map((e) => {
		let t = K(e.fromBox, n), r, i;
		if (e.toBox) {
			let a = q(t), o = q(K(e.toBox, n)), { strokeDasharray: s, strokeDashoffset: c } = Nr(a, o);
			r = x`<line class="fragment-link-path fragment-link-path-dashed"
        x1=${a.x} y1=${a.y} x2=${o.x} y2=${o.y}
        marker-end="url(#fragment-arrowhead)"
        stroke-dasharray=${s}
        stroke-dashoffset=${c}></line>`, i = {
				x: (a.x + o.x) / 2,
				y: (a.y + o.y) / 2
			};
		} else {
			let a = G(5, f), o = e.targetCorner ?? "br", s = n.naturalWidth, c = n.naturalHeight, l = o === "tl" ? {
				x: Math.min(a, s - a),
				y: Math.min(a, c - a)
			} : {
				x: Math.max(s - a, a),
				y: Math.max(c - a, a)
			}, u = q(t), d = o === "tl", p = d ? l : u, m = d ? u : l, { strokeDasharray: ee, strokeDashoffset: h } = Nr(p, m);
			r = x`<line class="fragment-link-path fragment-link-path-dashed"
        x1=${p.x} y1=${p.y} x2=${m.x} y2=${m.y}
        marker-end="url(#fragment-arrowhead)"
        stroke-dasharray=${ee}
        stroke-dashoffset=${h}></line>`, i = {
				x: (p.x + m.x) / 2,
				y: (p.y + m.y) / 2
			};
		}
		return x`
      <g class="fragment-link"
        data-thread-id=${e.threadId}
        data-fragment-from-id=${e.fromElementId}
        data-fragment-to-id=${e.toElementId ?? ""}
      >
        ${r}
        <text class="fragment-link-label"
          x=${i.x} y=${i.y}
          font-size=${G(pr, f)}
        >${e.toBox ? Sr : xr}</text>
      </g>`;
	}), h = c.map((e) => {
		let t = G(19.5, f), r = G(2, f), i = G(3, f), a = G(15, f), o = G(3, f), { x: s, y: c, w: l, h: u } = K(e.box, n), d = c + u - i - t, p = s + l - i - t, m = p - r - t;
		return x`
      <g class="fragment-nav" data-element-id=${e.elementId}>
        ${Rr(m, d, t, o, a, "prev", "‹", e.hasPrev)}
        ${Rr(p, d, t, o, a, "next", "›", e.hasNext)}
      </g>`;
	}), g = [];
	for (let e = 0; e < o.length - 1; e += 1) {
		let t = q(K(o[e].box, n)), r = q(K(o[e + 1].box, n));
		g.push(x`
      <line class="reading-order-step"
        x1=${t.x} y1=${t.y} x2=${r.x} y2=${r.y}
        marker-end="url(#reading-order-arrowhead)"
      ></line>`);
	}
	Ve(x`
      <defs>
        <pattern id="layer-hatch" width="16" height="16"
          patternUnits="userSpaceOnUse" patternTransform="rotate(45 8 8)">
          <rect class="layer-hatch-stripe" x="10" y="-4" width="6" height="24"></rect>
        </pattern>
        ${o.length >= 2 ? Pr("reading-order-arrowhead", p("readingOrder")) : ""}
        ${s.length ? Pr("fragment-arrowhead", p("fragment")) : ""}
        ${i.length ? Pr("caption-arrowhead", p("caption")) : ""}
        ${a.length ? Pr("xref-arrowhead", p("xref")) : ""}
      </defs>
      ${i.map((e) => Lr(n, e, {
		markerId: "caption-arrowhead",
		markerLayer: "caption",
		linkClass: "caption-link",
		fromIdAttr: "data-caption-id",
		toIdAttr: "data-host-id"
	}))}
      ${a.map((e) => Lr(n, e, {
		markerId: "xref-arrowhead",
		markerLayer: "xref",
		linkClass: "xref-link",
		fromIdAttr: "data-xref-from-id",
		toIdAttr: "data-xref-to-id"
	}))}
      ${ee}
      ${g}
      ${Mr(r, f.selectedId).map((e) => {
		let { x: t, y: r, w: i, h: a } = K(e, n), o = Or(e.kind), s = Dr(e.kind), c = Vt(e.layer ?? "body");
		return x`<rect
          class=${`bbox bbox-${o} ${s}${c ? ` ${c}` : ""}`}
          x=${t} y=${r}
          width=${Math.max(i, 1)} height=${Math.max(a, 1)}
          data-element-id=${e.elementId}
        ></rect>`;
	})}
      ${h}
      ${m}
    `, e);
}
function Br(e, t, n, r, i, a, o, s) {
	zr(t, {
		img: e,
		boxes: n,
		readingOrderSteps: r,
		showAllBboxes: i,
		showLayoutBadges: a,
		showReadingOrder: o,
		ctx: s
	});
}
function Vr(e, t, n = [], r = [], i = [], a = [], o = [], s, c, l, u, d, f) {
	let p = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	return p.classList.add("overlay"), p.setAttribute("viewBox", `0 0 ${e.naturalWidth} ${e.naturalHeight}`), p.setAttribute("overflow", "hidden"), zr(p, {
		img: e,
		boxes: t,
		captionLinks: n,
		xrefLinks: r,
		readingOrderSteps: i,
		fragmentLinks: a,
		fragmentNavItems: o,
		showAllBboxes: !1,
		showLayoutBadges: !1,
		showReadingOrder: !1,
		ctx: f
	}), p.addEventListener("click", (n) => {
		if (u()) {
			d(!1);
			return;
		}
		let r = n.target, i = r.closest(".fragment-nav-btn:not(.fragment-nav-btn-disabled)");
		if (i) {
			n.stopPropagation();
			let e = i.closest(".fragment-nav")?.getAttribute("data-element-id"), t = i.getAttribute("data-nav");
			e && t && c(e, t);
			return;
		}
		let a = r.closest(".overlay-badge[data-element-id]");
		if (a) {
			let e = a.getAttribute("data-element-id");
			e && s(e);
			return;
		}
		let o = p.getScreenCTM()?.inverse();
		if (o) {
			let r = p.createSVGPoint();
			r.x = n.clientX, r.y = n.clientY;
			let { x: i, y: a } = r.matrixTransform(o), c = Hr(t, e, i, a);
			c ? s(c.elementId) : l();
		}
	}), p.addEventListener("mousemove", (n) => {
		let r = p.getScreenCTM()?.inverse();
		if (r) {
			let i = p.createSVGPoint();
			i.x = n.clientX, i.y = n.clientY;
			let { x: a, y: o } = i.matrixTransform(r);
			p.style.cursor = Hr(t, e, a, o) ? "pointer" : "";
		}
	}), p.addEventListener("mouseleave", () => {
		p.style.cursor = "";
	}), p;
}
function Hr(e, t, n, r) {
	let i = null, a = Infinity;
	for (let o of e) {
		let { x: e, y: s, w: c, h: l, area: u } = K(o, t);
		n >= e && n <= e + c && r >= s && r <= s + l && u < a && (i = o, a = u);
	}
	return i;
}
//#endregion
//#region src/components/page-img-pane/page-img-pane.ts
var Ur = 5, Wr = "(No page image available.)", Gr = "doclang-viewer-overlay-prefs", Kr = "doclang-viewer-arrow-styles", qr = {
	showAllBboxes: !0,
	showLayoutBadges: !0,
	showReadingOrder: !1,
	readingOrderArrows: !0,
	readingOrderGlobal: !1,
	showPictureContents: !1,
	showTableContents: !1,
	showFragmentLinks: !1,
	showXrefLinks: !1,
	showCaptionLinks: !1
};
function Jr(e) {
	let t = (e || "").trim();
	if (/^#[0-9a-fA-F]{6}$/.test(t)) return t.toLowerCase();
	if (/^#[0-9a-fA-F]{3}$/.test(t)) return `#${t.slice(1).split("").map((e) => e + e).join("").toLowerCase()}`;
	let n = t.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
	return n ? `#${n.slice(1, 4).map((e) => Math.max(0, Math.min(255, Math.round(parseFloat(e)))).toString(16).padStart(2, "0")).join("")}` : "#000000";
}
var Yr = class extends U {
	constructor(...e) {
		super(...e), this._bodyRef = A(), this._settingsPanelRef = A(), this._settingsOpen = !1, this._visible = !1, this._zoomPct = 100, this._opts = { ...qr }, this._arrowStyles = {}, this._expandedArrowFields = /* @__PURE__ */ new Set(), this._pageController = new $n(this, () => this.scrollPane), this._panDrag = null, this._suppressClick = !1, this._layoutCache = null, this._layoutFrame = 0, this._resizeObserver = null, this._resetAllOverlaySettings = () => {
			this._arrowStyles = {}, this._persistArrowStyles(), this._applyArrowStyleVars(), this._expandedArrowFields.clear(), this._opts = { ...qr }, this._persistOverlayPrefs(), this._applyBboxVisibility(), this._emitOverlayChange(), this._docState && this._renderDocument(), this.requestUpdate();
		}, this._onZoomInput = (e) => {
			this._zoomPct = Math.max(100, Number(e.target.value)), this._layoutCache = null, this.requestUpdate(), this.refreshLayout();
		}, this._onPanningChange = (e) => {
			e.detail.panning && this._hideHint();
		}, this._onMousemove = (e) => {
			if (this._panDrag?.moved) {
				this._hideHint();
				return;
			}
			let t = (e.composedPath()[0] ?? e.target).closest(".element-badge[data-element-id]");
			if (!t || !this._docState?.idToElement) {
				this._hideHint();
				return;
			}
			let n = t.getAttribute("data-element-id"), r = n ? this._docState.idToElement.get(n) : null;
			if (!r) {
				this._hideHint();
				return;
			}
			this._showHint(this._elementHeadTooltipHtml(r, this._docState.defaultResolution), e);
		}, this._onMouseleave = () => this._hideHint();
	}
	static {
		this.styles = s(ur);
	}
	connectedCallback() {
		super.connectedCallback(), this.classList.add("pane", "pane-page-view"), this._loadOverlayPrefs(), this._loadArrowStyles(), this._applyArrowStyleVars(), this.addEventListener("doclang-panning-change", this._onPanningChange), this.addEventListener("mousemove", this._onMousemove), this.addEventListener("mouseleave", this._onMouseleave);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.removeEventListener("doclang-panning-change", this._onPanningChange), this.removeEventListener("mousemove", this._onMousemove), this.removeEventListener("mouseleave", this._onMouseleave), this._resizeObserver?.disconnect(), this._resizeObserver = null;
	}
	render() {
		let e = this._opts.showAllBboxes, t = e && this._opts.showReadingOrder;
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
			this._zoomPct !== 100 && this.resetZoom();
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
                ` : C}
        </div>
      </div>
      <div class="pane-page-layout">
        <div
          class="pane-body"
          id="page-img-pane"
          tabindex=${this._visible ? "0" : "-1"}
          ${j(this._bodyRef)}
        ></div>
        ${this._visible ? b`
              <doclang-settings-panel
                ${j(this._settingsPanelRef)}
                label="Overlays"
                @doclang-settings-close=${() => this._applySettingsOpen(!1)}
              >
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
                    class=${W({
			"settings-option": !0,
			"settings-option-sub": !0,
			"settings-option-disabled": !e
		})}
                  >
                    <input
                      type="checkbox"
                      class="cb-reading-order"
                      .checked=${this._opts.showReadingOrder}
                      ?disabled=${!e}
                      @change=${(e) => this._onOptChange("showReadingOrder", e.target.checked)}
                    />
                    <span>Reading order</span>
                  </label>
                  <div class="settings-subgroup settings-reading-order-group">
                    <div
                      class=${W({
			"arrow-layer-row": !0,
			"is-disabled": !t
		})}
                    >
                      <label
                        class=${W({
			"settings-option": !0,
			"settings-option-sub": !0,
			"settings-option-nested": !0,
			"settings-option-disabled": !t
		})}
                      >
                        <input
                          type="checkbox"
                          class="cb-reading-order-arrows"
                          .checked=${this._opts.readingOrderArrows}
                          ?disabled=${!t}
                          @change=${(e) => this._onOptChange("readingOrderArrows", e.target.checked)}
                        />
                        <span>Arrows</span>
                      </label>
                      <button
                        type="button"
                        class="arrow-style-btn"
                        aria-expanded=${String(this._expandedArrowFields.has("readingOrder") && t)}
                        aria-label="Reading-order arrow style"
                        title="Arrow style"
                        @click=${() => this._toggleArrowStyleFields("readingOrder")}
                      ></button>
                    </div>
                    ${this._renderArrowStyleFields("readingOrder", t)}
                    <label
                      class=${W({
			"settings-option": !0,
			"settings-option-sub": !0,
			"settings-option-nested": !0,
			"settings-option-disabled": !t
		})}
                    >
                      <input
                        type="checkbox"
                        class="cb-reading-order-global"
                        .checked=${this._opts.readingOrderGlobal}
                        ?disabled=${!t}
                        @change=${(e) => this._onOptChange("readingOrderGlobal", e.target.checked)}
                      />
                      <span>Global numbering</span>
                    </label>
                  </div>
                  <label
                    class=${W({
			"settings-option": !0,
			"settings-option-sub": !0,
			"settings-option-disabled": !e
		})}
                  >
                    <input
                      type="checkbox"
                      class="cb-picture-contents"
                      .checked=${this._opts.showPictureContents}
                      ?disabled=${!e}
                      @change=${(e) => this._onOptChange("showPictureContents", e.target.checked)}
                    />
                    <span>Picture contents</span>
                  </label>
                  <label
                    class=${W({
			"settings-option": !0,
			"settings-option-sub": !0,
			"settings-option-disabled": !e
		})}
                  >
                    <input
                      type="checkbox"
                      class="cb-table-contents"
                      .checked=${this._opts.showTableContents}
                      ?disabled=${!e}
                      @change=${(e) => this._onOptChange("showTableContents", e.target.checked)}
                    />
                    <span>Table contents</span>
                  </label>

                  <div
                    class=${W({
			"arrow-layer-row": !0,
			"is-disabled": !e
		})}
                  >
                    <label
                      class=${W({
			"settings-option": !0,
			"settings-option-sub": !0,
			"settings-option-disabled": !e
		})}
                    >
                      <input
                        type="checkbox"
                        class="cb-fragment-links"
                        .checked=${this._opts.showFragmentLinks}
                        ?disabled=${!e}
                        @change=${(e) => this._onOptChange("showFragmentLinks", e.target.checked)}
                      />
                      <span>Fragments</span>
                    </label>
                    <button
                      type="button"
                      class="arrow-style-btn"
                      aria-expanded=${String(this._expandedArrowFields.has("fragment") && e)}
                      aria-label="Fragment arrow style"
                      title="Arrow style"
                      @click=${() => this._toggleArrowStyleFields("fragment")}
                    ></button>
                  </div>
                  ${this._renderArrowStyleFields("fragment", e)}

                  <div
                    class=${W({
			"arrow-layer-row": !0,
			"is-disabled": !e
		})}
                  >
                    <label
                      class=${W({
			"settings-option": !0,
			"settings-option-sub": !0,
			"settings-option-disabled": !e
		})}
                    >
                      <input
                        type="checkbox"
                        class="cb-xref-links"
                        .checked=${this._opts.showXrefLinks}
                        ?disabled=${!e}
                        @change=${(e) => this._onOptChange("showXrefLinks", e.target.checked)}
                      />
                      <span title="Cross-references">Cross-references</span>
                    </label>
                    <button
                      type="button"
                      class="arrow-style-btn"
                      aria-expanded=${String(this._expandedArrowFields.has("xref") && e)}
                      aria-label="Cross-reference arrow style"
                      title="Arrow style"
                      @click=${() => this._toggleArrowStyleFields("xref")}
                    ></button>
                  </div>
                  ${this._renderArrowStyleFields("xref", e)}

                  <div
                    class=${W({
			"arrow-layer-row": !0,
			"is-disabled": !e
		})}
                  >
                    <label
                      class=${W({
			"settings-option": !0,
			"settings-option-sub": !0,
			"settings-option-disabled": !e
		})}
                    >
                      <input
                        type="checkbox"
                        class="cb-caption-links"
                        .checked=${this._opts.showCaptionLinks}
                        ?disabled=${!e}
                        @change=${(e) => this._onOptChange("showCaptionLinks", e.target.checked)}
                      />
                      <span>Captions</span>
                    </label>
                    <button
                      type="button"
                      class="arrow-style-btn"
                      aria-expanded=${String(this._expandedArrowFields.has("caption") && e)}
                      aria-label="Caption arrow style"
                      title="Arrow style"
                      @click=${() => this._toggleArrowStyleFields("caption")}
                    ></button>
                  </div>
                  ${this._renderArrowStyleFields("caption", e)}

                  <label
                    class=${W({
			"settings-option": !0,
			"settings-option-sub": !0,
			"settings-option-disabled": !e
		})}
                  >
                    <input
                      type="checkbox"
                      class="cb-layout-badges"
                      .checked=${this._opts.showLayoutBadges}
                      ?disabled=${!e}
                      @change=${(e) => this._onOptChange("showLayoutBadges", e.target.checked)}
                    />
                    <span>Badges</span>
                  </label>
                </div>

                <div class="settings-divider" role="separator"></div>
                <button
                  type="button"
                  class="overlays-reset"
                  @click=${this._resetAllOverlaySettings}
                >
                  Reset all
                </button>
              </doclang-settings-panel>
            ` : C}
      </div>
      <div
        id="page-view-hint"
        popover="manual"
        role="tooltip"
        class="page-view-hint"
      ></div>
    `;
	}
	firstUpdated() {
		let e = this._bodyRef.value;
		e && this._wirePanEvents(e);
	}
	get zoomPercent() {
		return this._zoomPct;
	}
	get overlaySettings() {
		return this._opts;
	}
	get scrollPane() {
		return this._scrollPane();
	}
	setVisible(e) {
		this._visible = e, this.hidden = !e, this.requestUpdate();
	}
	refreshLayout() {
		let e = this._bodyRef.value;
		e && (this._resizeObserver || (this._resizeObserver = new ResizeObserver(() => this.refreshLayout()), this._resizeObserver.observe(e)), cancelAnimationFrame(this._layoutFrame), this._layoutFrame = requestAnimationFrame(() => {
			this._layoutFrame = 0;
			let t = e.querySelector(".page-view img");
			t?.naturalWidth && (jr(t, e, this._overlayCtx()), this._updatePanCursor(), this._syncOverlayBadgesForImg(t), this.dispatchEvent(new CustomEvent("doclang-layout-refresh", {
				bubbles: !0,
				composed: !0
			})));
		}));
	}
	activateZoom(e) {
		this._zoomPct = e, this._layoutCache = null, this.requestUpdate(), this._resetScroll();
	}
	resetZoom() {
		this._zoomPct = 100, this._layoutCache = null, this.requestUpdate(), this._resetScroll(), this.refreshLayout();
	}
	toggleSettings() {
		this._applySettingsOpen(!this._settingsOpen);
	}
	_applySettingsOpen(e) {
		this._settingsOpen = e, this._settingsPanelRef.value?.setOpen(e), this.requestUpdate();
	}
	_applySelection() {
		let e = this._bodyRef.value;
		if (!e) return;
		for (let t of e.querySelectorAll(".bbox.selected, .overlay-badge.selected")) t.classList.remove("selected");
		if (this.selected && this._docState?.hasPageView) for (let t of e.querySelectorAll(`[data-element-id="${this.selected}"]`)) t.classList.add("selected");
		let t = e.querySelector(".page-view img");
		t && this._syncOverlayBadgesForImg(t), this._applyBboxVisibility();
	}
	_renderDocument() {
		let e = this._bodyRef.value;
		if (!e) {
			this.requestUpdate(), this.updateComplete.then(() => this._renderDocument());
			return;
		}
		let t = this._docState;
		if (e.innerHTML = "", this._layoutCache = null, this.selected = null, this._peerIds = /* @__PURE__ */ new Set(), !t?.hasPageView) return;
		let n = t.pageImages.get(this.page);
		if (!n) {
			e.innerHTML = `<div class="placeholder">${Wr}</div>`;
			return;
		}
		let r = document.createElement("div");
		r.className = "page-view-port";
		let i = document.createElement("div");
		i.className = "page-view";
		let a = document.createElement("img");
		a.alt = `Page ${this.page}`;
		let o = this.page, s = () => {
			if (a.dataset.layoutGeneration === String(o)) return;
			a.dataset.layoutGeneration = String(o), jr(a, e, this._overlayCtx());
			let n = t.segments[o - 1] ?? [], r = _n(n);
			t.elementIds = r, t.idToElement = vn(r);
			let s = An(n, t.defaultResolution, r), c = i.querySelector("svg.overlay");
			c && c.remove();
			let l = In(n, r, s, t.readingOrder, this._opts.readingOrderGlobal, t.readingOrderDisplayNumbers);
			s.length && i.appendChild(Vr(a, s, jn(n, r, s), Mn(n, r, s), l, Pn(n, r, s, o, t.threadPagesById), Fn(n, r, s, t.threadNavByElement), (e) => this.dispatchEvent(new CustomEvent("doclang-element-select", {
				bubbles: !0,
				composed: !0,
				detail: { id: e }
			})), (e, t) => this.dispatchEvent(new CustomEvent("doclang-navigate-thread", {
				bubbles: !0,
				composed: !0,
				detail: {
					elementId: e,
					direction: t
				}
			})), () => this.dispatchEvent(new CustomEvent("doclang-clear-selection", {
				bubbles: !0,
				composed: !0
			})), () => this._suppressClick, (e) => {
				this._suppressClick = e;
			}, this._overlayCtx())), this._syncOverlayBadgesForImg(a), this._applyBboxVisibility();
			let u = t.pendingSelectElement;
			if (u) {
				t.pendingSelectElement = null;
				let e = this._findElementIdOnPage(u, r);
				e && this.dispatchEvent(new CustomEvent("doclang-element-select", {
					bubbles: !0,
					composed: !0,
					detail: { id: e }
				}));
			}
		};
		a.addEventListener("load", s, { once: !0 }), i.appendChild(a), r.appendChild(i), e.appendChild(r), a.src = n, a.complete && s(), this.refreshLayout();
	}
	_clearDocument() {
		let e = this._bodyRef.value;
		e && (e.innerHTML = ""), this._layoutCache = null;
	}
	_overlayCtx() {
		let e = this._bodyRef.value;
		return {
			zoomPct: this._zoomPct,
			pane: e,
			layoutCache: this._layoutCache,
			setLayoutCache: (e) => {
				this._layoutCache = e;
			},
			selectedId: this.selected,
			arrowMarkerOptions: (e) => this._arrowMarkerOptions(e)
		};
	}
	_syncOverlayBadgesForImg(e) {
		let t = e.parentElement?.querySelector("svg.overlay"), n = this._docState;
		if (!t || !n) return;
		let r = this.page, i = n.segments[r - 1] ?? [], a = An(i, n.defaultResolution, n.elementIds), o = In(i, n.elementIds, a, n.readingOrder, this._opts.readingOrderGlobal, n.readingOrderDisplayNumbers), { showAllBboxes: s, showLayoutBadges: c, showReadingOrder: l } = this._opts;
		Br(e, t, a, o, s, c, l, this._overlayCtx());
	}
	_isContentsOptionHidden(e, t) {
		if (t) return !1;
		let n = this._docState?.idToElement?.get(e) ?? null;
		return !!(!this._opts.showPictureContents && qt(n) || !this._opts.showTableContents && Jt(n));
	}
	_isFragmentLinkRelevant(e) {
		let t = e.getAttribute("data-fragment-from-id"), n = e.getAttribute("data-fragment-to-id");
		return !!(t && this._peerIds.has(t) || n && this._peerIds.has(n));
	}
	_applyBboxVisibility() {
		let e = this._bodyRef.value;
		if (!e || !this._docState?.hasPageView) return;
		let { showAllBboxes: t, showLayoutBadges: n, showCaptionLinks: r, showXrefLinks: i, showFragmentLinks: a, showReadingOrder: o, readingOrderArrows: s } = this._opts, c = this.selected, l = this._peerIds;
		for (let n of e.querySelectorAll(".bbox")) {
			n.classList.remove("related");
			let e = n.getAttribute("data-element-id") ?? "", r = e === c || l.has(e);
			if (t) {
				this._isContentsOptionHidden(e, r) ? n.classList.add("bbox-hidden") : (n.classList.remove("bbox-hidden"), l.has(e) && n.classList.add("related"));
				continue;
			}
			e === c ? n.classList.remove("bbox-hidden") : l.has(e) ? (n.classList.remove("bbox-hidden"), n.classList.add("related")) : n.classList.add("bbox-hidden");
		}
		for (let r of e.querySelectorAll(".element-badge")) {
			let e = r.getAttribute("data-element-id") ?? "", i = e === c || l.has(e);
			if (!t || !n) {
				r.classList.add("bbox-hidden");
				continue;
			}
			this._isContentsOptionHidden(e, i) ? r.classList.add("bbox-hidden") : r.classList.remove("bbox-hidden");
		}
		for (let n of e.querySelectorAll(".caption-link")) n.classList.toggle("bbox-hidden", !t || !r);
		for (let n of e.querySelectorAll(".xref-link")) n.classList.toggle("bbox-hidden", !t || !i);
		for (let n of e.querySelectorAll(".fragment-link")) {
			let e = !!(c && this._isFragmentLinkRelevant(n));
			n.classList.toggle("bbox-hidden", !(e || t && a));
		}
		for (let n of e.querySelectorAll(".fragment-nav")) {
			let e = n.getAttribute("data-element-id") ?? "", r = e === c || l.has(e);
			n.classList.toggle("bbox-hidden", !(r || t && a));
		}
		for (let n of e.querySelectorAll(".reading-order-badge")) {
			let e = n.getAttribute("data-element-id") ?? "", r = e === c || l.has(e);
			if (!t || !o) {
				n.classList.add("bbox-hidden");
				continue;
			}
			let i = this._docState?.idToElement?.get(e) ?? null;
			if (qt(i) || Jt(i) || this._isContentsOptionHidden(e, r)) {
				n.classList.add("bbox-hidden");
				continue;
			}
			n.classList.remove("bbox-hidden");
		}
		for (let n of e.querySelectorAll(".reading-order-step")) n.classList.toggle("bbox-hidden", !t || !o || !s);
	}
	_findElementIdOnPage(e, t) {
		return t.get(e) ?? null;
	}
	_scrollPane() {
		let e = this._bodyRef.value;
		return e ? e.querySelector(".page-view-port") ?? e : null;
	}
	_isScrollable() {
		let e = this._scrollPane();
		return e ? e.scrollWidth > e.clientWidth || e.scrollHeight > e.clientHeight : !1;
	}
	_resetScroll() {
		let e = this._scrollPane();
		e && (e.scrollLeft = 0, e.scrollTop = 0);
	}
	_updatePanCursor() {
		let e = this._bodyRef.value;
		e && e.classList.toggle("can-pan", this._isScrollable() && !this._panDrag);
	}
	_onOptChange(e, t) {
		this._opts[e] = t, this._persistOverlayPrefs(), e === "readingOrderGlobal" && this._docState && this._renderDocument();
		let n = this._bodyRef.value?.querySelector(".page-view img");
		n && this._syncOverlayBadgesForImg(n), this._applyBboxVisibility(), this._emitOverlayChange(), this.requestUpdate();
	}
	_loadOverlayPrefs() {
		try {
			let e = localStorage.getItem(Gr);
			if (!e) return;
			let t = JSON.parse(e);
			if (!t || typeof t != "object") return;
			for (let e of Object.keys(qr)) typeof t[e] == "boolean" && (this._opts[e] = t[e]);
		} catch {}
	}
	_persistOverlayPrefs() {
		try {
			localStorage.setItem(Gr, JSON.stringify(this._opts));
		} catch {}
	}
	_loadArrowStyles() {
		try {
			let e = localStorage.getItem(Kr);
			if (!e) return;
			let t = JSON.parse(e);
			t && typeof t == "object" && !Array.isArray(t) && (this._arrowStyles = t);
		} catch {
			this._arrowStyles = {};
		}
	}
	_persistArrowStyles() {
		try {
			localStorage.setItem(Kr, JSON.stringify(this._arrowStyles));
		} catch {}
	}
	_getArrowStyle(e) {
		let t = Cr[e], n = this._arrowStyles[e] ?? {};
		return {
			color: n.color,
			width: n.width ?? wr.width,
			head: n.head ?? wr.head,
			style: n.style ?? t.defaultStyle
		};
	}
	_resolveArrowColor(e) {
		let t = this._arrowStyles[e]?.color;
		if (t) return t;
		let n = Cr[e];
		return getComputedStyle(this).getPropertyValue(n.colorVar).trim() || "currentColor";
	}
	_arrowMarkerOptions(e) {
		return {
			size: this._getArrowStyle(e).head,
			color: this._resolveArrowColor(e)
		};
	}
	_applyArrowStyleVars() {
		let e = this.style;
		for (let [t, n] of Object.entries(Cr)) {
			let r = this._arrowStyles[t] ?? {}, i = `--arrow-${n.cssKey}`;
			r.color ? e.setProperty(`${i}-color`, r.color) : e.removeProperty(`${i}-color`), r.width == null ? e.removeProperty(`${i}-width`) : e.setProperty(`${i}-width`, String(r.width)), r.style == null ? (e.removeProperty(`${i}-dash`), e.removeProperty(`${i}-cap`)) : (e.setProperty(`${i}-dash`, Tr[r.style] ?? "none"), e.setProperty(`${i}-cap`, r.style === "dotted" ? "round" : "butt"));
		}
	}
	_toggleArrowStyleFields(e) {
		this._expandedArrowFields.has(e) ? this._expandedArrowFields.delete(e) : this._expandedArrowFields.add(e), this.requestUpdate();
	}
	_onArrowStyleFieldChange(e, t, n) {
		let r = this._arrowStyles[e] ?? (this._arrowStyles[e] = {});
		t === "color" ? r.color = String(n) : t === "style" ? r.style = n : (t === "width" || t === "head") && (r[t] = Number(n)), this._persistArrowStyles(), this._applyArrowStyleVars();
		let i = this._bodyRef.value?.querySelector(".page-view img");
		i && this._syncOverlayBadgesForImg(i), this.requestUpdate();
	}
	_renderArrowStyleFields(e, t) {
		if (!this._expandedArrowFields.has(e) || !t) return C;
		let n = this._getArrowStyle(e);
		return b`
      <div class="arrow-style-fields" id="arrow-fields-${e}">
        <label>
          Color
          <input
            type="color"
            .value=${Jr(this._resolveArrowColor(e))}
            @input=${(t) => this._onArrowStyleFieldChange(e, "color", t.target.value)}
          />
        </label>
        <label>
          Thickness
          <span class="arrow-field-control">
            <input
              type="range"
              min="0.5"
              max="6"
              step="0.5"
              .value=${String(n.width)}
              title=${String(n.width)}
              @input=${(t) => this._onArrowStyleFieldChange(e, "width", Number(t.target.value))}
            />
            <output class="arrow-field-value" aria-hidden="true">${n.width}</output>
          </span>
        </label>
        <label>
          Head
          <span class="arrow-field-control">
            <input
              type="range"
              min="3"
              max="14"
              step="1"
              .value=${String(n.head)}
              title=${String(n.head)}
              @input=${(t) => this._onArrowStyleFieldChange(e, "head", Number(t.target.value))}
            />
            <output class="arrow-field-value" aria-hidden="true">${n.head}</output>
          </span>
        </label>
        <label>
          Line
          <select
            .value=${n.style}
            @change=${(t) => this._onArrowStyleFieldChange(e, "style", t.target.value)}
          >
            <option value="solid" ?selected=${n.style === "solid"}>Solid</option>
            <option value="dashed" ?selected=${n.style === "dashed"}>Dashed</option>
            <option value="dotted" ?selected=${n.style === "dotted"}>Dotted</option>
          </select>
        </label>
      </div>
    `;
	}
	_emitOverlayChange() {
		this.dispatchEvent(new CustomEvent("doclang-overlay-change", {
			bubbles: !0,
			composed: !0,
			detail: { ...this._opts }
		}));
	}
	_wirePanEvents(e) {
		e.addEventListener("pointerdown", (e) => {
			if (e.button !== 0 || !(e.target instanceof Element) || !e.target.closest(".page-view") || !this._isScrollable()) return;
			let t = this._scrollPane();
			t && (this._panDrag = {
				pointerId: e.pointerId,
				startX: e.clientX,
				startY: e.clientY,
				scrollLeft: t.scrollLeft,
				scrollTop: t.scrollTop,
				moved: !1
			});
		}), e.addEventListener("pointermove", (t) => {
			if (!this._panDrag || t.pointerId !== this._panDrag.pointerId) return;
			let n = t.clientX - this._panDrag.startX, r = t.clientY - this._panDrag.startY;
			if (!this._panDrag.moved && Math.hypot(n, r) >= Ur && (this._panDrag.moved = !0, e.classList.add("is-panning"), e.classList.remove("can-pan"), e.setPointerCapture(t.pointerId), this.dispatchEvent(new CustomEvent("doclang-panning-change", {
				bubbles: !0,
				composed: !0,
				detail: { panning: !0 }
			}))), !this._panDrag.moved) return;
			let i = this._scrollPane();
			i && (i.scrollLeft = this._panDrag.scrollLeft + this._panDrag.startX - t.clientX, i.scrollTop = this._panDrag.scrollTop + this._panDrag.startY - t.clientY, t.preventDefault());
		});
		let t = (t) => {
			if (!this._panDrag || t.pointerId !== this._panDrag.pointerId) return;
			let n = this._panDrag.moved;
			n && (this._suppressClick = !0), this._panDrag = null, e.classList.remove("is-panning"), n && this.dispatchEvent(new CustomEvent("doclang-panning-change", {
				bubbles: !0,
				composed: !0,
				detail: { panning: !1 }
			})), e.hasPointerCapture(t.pointerId) && e.releasePointerCapture(t.pointerId), this._updatePanCursor();
		};
		e.addEventListener("pointerup", (e) => t(e)), e.addEventListener("pointercancel", (e) => t(e)), e.setAttribute("role", "region"), e.setAttribute("aria-label", "Original page"), e.addEventListener("pointerdown", () => {
			this._docState?.hasPageView && e.focus({ preventScroll: !0 });
		});
	}
	_showHint(e, t) {
		let n = this.shadowRoot?.querySelector(".page-view-hint") ?? null;
		n && (n.innerHTML = e, n.style.top = `${t.clientY + 14}px`, n.style.left = `${t.clientX + 14}px`, n.matches(":popover-open") || n.showPopover());
	}
	_hideHint() {
		let e = this.shadowRoot?.querySelector(".page-view-hint") ?? null;
		e?.matches(":popover-open") && e.hidePopover();
	}
	_elementHeadTooltipHtml(e, t) {
		return `<table class="head-tooltip"><tbody>${this._collectElementHeadInfo(e, t).map(({ key: e, value: t, isDefault: n }) => {
			let r = kt(t), i = n ? " <span class=\"head-default\">(default)</span>" : "";
			return `<tr><th scope="row">${kt(e)}</th><td>${r}${i}</td></tr>`;
		}).join("")}</tbody></table>`;
	}
	_collectElementHeadInfo(e, t) {
		let n = V(e, "label"), r = V(e, "thread"), i = V(e, "xref"), a = V(e, "href"), o = V(e, "layer"), s = V(e, "caption"), c = V(e, "description"), l = V(e, "summary"), u = V(e, "custom"), d = Kt(e), f = [{
			key: "element",
			value: Ht(e),
			isDefault: !1
		}];
		f.push({
			key: "label",
			value: n?.getAttribute("value") ?? "undefined",
			isDefault: !n?.hasAttribute("value")
		}), r ? f.push({
			key: "thread_id",
			value: r.getAttribute("thread_id") ?? "—",
			isDefault: !1
		}) : f.push({
			key: "thread",
			value: "—",
			isDefault: !0
		}), i ? f.push({
			key: "xref",
			value: `thread_id ${i.getAttribute("thread_id") ?? "—"}`,
			isDefault: !1
		}) : f.push({
			key: "xref",
			value: "—",
			isDefault: !0
		}), a ? f.push({
			key: "href",
			value: a.getAttribute("uri") ?? "—",
			isDefault: !1
		}) : f.push({
			key: "href",
			value: "—",
			isDefault: !0
		}), f.push({
			key: "layer",
			value: o?.getAttribute("value") ?? "body",
			isDefault: !o?.hasAttribute("value")
		});
		let p = [
			"x_min",
			"y_min",
			"x_max",
			"y_max"
		];
		if (d.length === 4) for (let e = 0; e < 4; e += 1) {
			let n = d[e], r = wt(n, e % 2 == 0 ? t.width : t.height), i = n.getAttribute("value") ?? "0";
			f.push({
				key: p[e],
				value: `${i} @ ${r}`,
				isDefault: !1
			});
		}
		else for (let e of p) f.push({
			key: e,
			value: "—",
			isDefault: !1
		});
		let m = (e, t = 72) => {
			let n = e.textContent?.replace(/\s+/g, " ").trim() ?? "";
			return n ? n.length > t ? `${n.slice(0, t)}…` : n : "—";
		};
		return f.push({
			key: "caption",
			value: s ? m(s) : "—",
			isDefault: !s
		}), f.push({
			key: "description",
			value: c ? m(c) : "—",
			isDefault: !c
		}), f.push({
			key: "summary",
			value: l ? m(l) : "—",
			isDefault: !l
		}), f.push({
			key: "custom",
			value: u ? m(u) : "—",
			isDefault: !u
		}), f;
	}
};
Yr = H([E("doclang-page-img-pane")], Yr);
//#endregion
//#region src/components/reading-pane/reading-pane.css?inline
var Xr = ":host{--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark;--bg:var(--doclang-bg,#f4f4f5);--panel:var(--doclang-panel,#fff);--border:var(--doclang-border,#d4d4d8);--text:var(--doclang-text,#18181b);--muted:var(--doclang-muted,#71717a);--accent:var(--doclang-accent,#2563eb);--placeholder-bg:var(--doclang-placeholder-bg,#fafafa);--font-ui:var(--doclang-font-ui,system-ui, -apple-system, \"Segoe UI\", sans-serif);--font-mono:var(--doclang-font-mono,ui-monospace, \"Cascadia Code\", \"Source Code Pro\", monospace);--markup-bg:var(--doclang-markup-bg,#fff);--markup-fg:var(--doclang-markup-fg,#24292e);--markup-hover:var(--doclang-markup-hover,#2563eb14);--markup-selected:var(--doclang-markup-selected,#2563eb24);--kind-text:var(--doclang-kind-text,#2563eb);--kind-heading:var(--doclang-kind-heading,#7c3aed);--kind-list:var(--doclang-kind-list,#ea580c);--kind-ldiv:var(--doclang-kind-ldiv,#ea580c);--kind-table:var(--doclang-kind-table,#16a34a);--kind-index:var(--doclang-kind-index,#0d9488);--kind-formula:var(--doclang-kind-formula,#0891b2);--kind-code:var(--doclang-kind-code,#475569);--kind-picture:var(--doclang-kind-picture,#db2777);--kind-group:var(--doclang-kind-group,#4f46e5);--kind-footnote:var(--doclang-kind-footnote,#a16207);--kind-page_header:var(--doclang-kind-page_header,#71717a);--kind-page_footer:var(--doclang-kind-page_footer,#71717a);--kind-caption:var(--doclang-kind-caption,#71717a);--kind-field:var(--doclang-kind-field,#d97706);--kind-default:var(--doclang-kind-default,#dc2626)}@media (prefers-color-scheme:dark){:host{--lightningcss-light: ;--lightningcss-dark:initial;--bg:var(--doclang-bg,#09090b);--panel:var(--doclang-panel,#18181b);--border:var(--doclang-border,#3f3f46);--text:var(--doclang-text,#fafafa);--muted:var(--doclang-muted,#a1a1aa);--placeholder-bg:var(--doclang-placeholder-bg,#27272a);--markup-bg:var(--doclang-markup-bg,#1e1e1e);--markup-fg:var(--doclang-markup-fg,#d4d4d4);--markup-hover:var(--doclang-markup-hover,#60a5fa1a);--markup-selected:var(--doclang-markup-selected,#60a5fa2e);--kind-text:var(--doclang-kind-text,#60a5fa);--kind-heading:var(--doclang-kind-heading,#a78bfa);--kind-list:var(--doclang-kind-list,#fb923c);--kind-ldiv:var(--doclang-kind-ldiv,#fb923c);--kind-table:var(--doclang-kind-table,#4ade80);--kind-index:var(--doclang-kind-index,#2dd4bf);--kind-formula:var(--doclang-kind-formula,#22d3ee);--kind-code:var(--doclang-kind-code,#94a3b8);--kind-picture:var(--doclang-kind-picture,#f472b6);--kind-group:var(--doclang-kind-group,#818cf8);--kind-footnote:var(--doclang-kind-footnote,#facc15);--kind-page_header:var(--doclang-kind-page_header,#a1a1aa);--kind-page_footer:var(--doclang-kind-page_footer,#a1a1aa);--kind-caption:var(--doclang-kind-caption,#a1a1aa);--kind-field:var(--doclang-kind-field,#fbbf24);--kind-default:var(--doclang-kind-default,#f87171)}}:host{border-right:1px solid var(--border);background:var(--panel);flex-direction:column;min-width:0;min-height:0;display:flex}:host([hidden]){display:none!important}:host(.pane-layout-last){border-right:none}.pane-header{box-sizing:border-box;letter-spacing:.04em;text-transform:uppercase;height:2.125rem;color:var(--muted);border-bottom:1px solid var(--border);background:var(--panel);justify-content:space-between;align-items:center;padding:0 .75rem;font-size:.75rem;font-weight:600;display:flex}.pane-header-title{min-width:0}.pane-settings-toggle{appearance:none;color:var(--muted);cursor:pointer;white-space:nowrap;letter-spacing:.04em;text-transform:uppercase;height:1.25rem;font-size:.625rem;font-weight:600;line-height:1;font:inherit;background:0 0;border:1px solid #0000;border-radius:.25rem;flex-shrink:0;align-items:center;padding:0 .28rem 0 .4rem;transition:color .12s,background .12s,border-color .12s;display:inline-flex}.pane-settings-toggle:after{content:\"\";opacity:.65;border-bottom:1.5px solid;border-right:1.5px solid;flex-shrink:0;width:.26rem;height:.26rem;margin-top:-.1em;margin-left:.22rem;transform:rotate(45deg)}.pane-settings-toggle:hover{color:var(--text);background:color-mix(in srgb, var(--text) 5%, transparent)}.pane-settings-toggle[aria-expanded=true]{color:var(--accent);background:color-mix(in srgb, var(--accent) 10%, var(--panel));border-color:color-mix(in srgb, var(--accent) 22%, transparent)}.pane-settings-toggle:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.pane-reading-layout{flex-direction:column;flex:1;min-width:0;min-height:0;display:flex;position:relative}.pane-body{flex:auto;min-width:0;min-height:0;padding:1rem;overflow:auto}.settings-option{cursor:pointer;-webkit-user-select:none;user-select:none;align-items:flex-start;gap:.5rem;font-size:.875rem;display:flex}.settings-subgroup{flex-direction:column;gap:.5rem;padding-left:.85rem;display:flex}.settings-option-sub{color:var(--muted);font-size:.8125rem}.settings-option input{cursor:pointer;flex-shrink:0;margin:.15rem 0 0}.rendered-doc{max-width:42rem;margin:0 auto;line-height:1.6}.rendered-el-virtual-text>p,.rendered-el-virtual-text>div{margin:0;display:inline}.rendered-doc li>.rendered-el-virtual-text{display:inline}.rendered-doc li>.rendered-el-virtual-text>p,.rendered-doc li>.rendered-el-virtual-text>div,.rendered-table .rendered-el-virtual-text,.rendered-table .rendered-el-virtual-text>p,.rendered-table .rendered-el-virtual-text>div{margin:0;display:inline}.rendered-el-virtual-text>div>.rendered-el{margin:.25rem 0;display:block}.rendered-el{cursor:pointer;border-radius:.25rem}.rendered-el:hover{outline:1px solid color-mix(in srgb, var(--accent) 35%, transparent)}.rendered-el.selected{outline:2px solid var(--accent);outline-offset:2px;background:color-mix(in srgb, var(--accent) 8%, transparent)}.rendered-doc p{margin:0 0 .75rem}.rendered-doc h1,.rendered-doc h2,.rendered-doc h3,.rendered-doc h4,.rendered-doc h5,.rendered-doc h6{margin:1.25rem 0 .5rem;line-height:1.25}.rendered-doc h1:first-child,.rendered-doc h2:first-child,.rendered-doc h3:first-child{margin-top:0}.rendered-doc ul,.rendered-doc ol{margin:0 0 .75rem;padding-left:1.5rem}.rendered-doc li{margin:.25rem 0}.rendered-doc li>.rendered-el>p:first-child,.rendered-doc li>.rendered-el>h1:first-child,.rendered-doc li>.rendered-el>h2:first-child,.rendered-doc li>.rendered-el>h3:first-child,.rendered-doc li>.rendered-el>h4:first-child,.rendered-doc li>.rendered-el>h5:first-child,.rendered-doc li>.rendered-el>h6:first-child{margin-top:0}.rendered-marker{margin-right:.35rem}.rendered-handwriting{font-family:Segoe Print,Bradley Hand,cursive}.rendered-doc pre{font-family:var(--font-mono);background:var(--placeholder-bg);border:1px solid var(--border);border-radius:.375rem;margin:0 0 .75rem;padding:.75rem 1rem;font-size:.8125rem;line-height:1.5;overflow-x:auto}.rendered-doc code{font-family:var(--font-mono);font-size:.875em}.rendered-doc pre code{font-size:inherit;background:0 0;border:none;padding:0}.rendered-code-label{color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:.25rem;font-size:.75rem;font-weight:600;display:block}.rendered-formula{font-family:var(--font-mono);background:var(--placeholder-bg);border-left:3px solid var(--border);margin:0 0 .75rem;padding:.5rem .75rem;font-size:.875rem;display:block;overflow-x:auto}.rendered-formula-inline{font-family:var(--font-mono);font-size:.875em;display:inline}.rendered-doc figure{margin:0 0 .75rem}.rendered-doc figure img{border:1px solid var(--border);border-radius:.25rem;max-width:100%;height:auto}.rendered-doc figure img.rendered-picture-unavailable{object-fit:contain;vertical-align:middle;min-width:3rem;min-height:2.5rem;display:inline-block}.rendered-doc figcaption{color:var(--muted);margin-top:.35rem;font-size:.875rem}.rendered-picture-contents{border:1px solid var(--border);background:var(--placeholder-bg);border-radius:.375rem;margin-top:.5rem;font-size:.875rem}.rendered-picture-contents summary{cursor:pointer;color:var(--muted);-webkit-user-select:none;user-select:none;padding:.4rem .65rem;font-weight:600}.rendered-picture-contents summary:hover{color:var(--text)}.rendered-picture-contents-body{border-top:1px solid var(--border);padding:.5rem .75rem .75rem}.rendered-picture-contents-body .rendered-el>p{margin-bottom:.35rem;font-size:.8125rem}.rendered-table{border-collapse:collapse;width:100%;margin:0 0 .75rem;font-size:.875rem}.rendered-table caption{caption-side:top;color:var(--muted);text-align:left;margin-bottom:.35rem;font-size:.875rem}.rendered-table th,.rendered-table td{border:1px solid var(--border);vertical-align:top;text-align:left;padding:.35rem .5rem}.rendered-table th{background:color-mix(in srgb, var(--border) 35%, var(--panel));font-weight:600}.rendered-table .rendered-table-cell-text{display:inline}.rendered-table .rendered-el,.rendered-table .rendered-el-virtual-text>p,.rendered-table .rendered-el-virtual-text>div{margin:0}.rendered-table .rendered-table{margin:.25rem 0 0}.rendered-page-header,.rendered-page-footer{color:var(--muted);font-size:.875rem}.rendered-page-header{border-bottom:1px solid var(--border);margin-bottom:1rem;padding-bottom:.5rem}.rendered-page-footer{border-top:1px solid var(--border);margin-top:1rem;padding-top:.5rem}.pane-body:not(.show-reading-furniture) .rendered-el[data-doclang-layer=furniture],.pane-body:not(.show-reading-background) .rendered-el[data-doclang-layer=background]{display:none}.rendered-el[data-doclang-layer=furniture],.rendered-el[data-doclang-layer=background]{position:relative}.rendered-el[data-doclang-layer=furniture]:before,.rendered-el[data-doclang-layer=background]:before{content:\"\";border-radius:inherit;pointer-events:none;background:repeating-linear-gradient(-45deg, transparent 0 10px, color-mix(in srgb, var(--muted) 6%, transparent) 10px 16px);position:absolute;inset:0}.rendered-el.rendered-footnote>aside{color:var(--muted);border-left:2px solid var(--border);margin:0 0 .75rem;padding-left:.75rem;font-size:.875rem}.rendered-unsupported{color:var(--muted);background:var(--placeholder-bg);border:1px dashed var(--border);border-radius:.375rem;margin:0 0 .75rem;padding:.5rem .75rem;font-size:.8125rem;font-style:italic}.rendered-field-region{border:1px solid var(--border);background:color-mix(in srgb, var(--kind-field) 6%, transparent);border-radius:.5rem;margin:0 0 1rem;padding:.75rem 1rem}.rendered-field-region>.rendered-field-heading:first-child,.rendered-field-region>.rendered-el.rendered-field_heading>.rendered-field-heading:first-child{margin-top:0}.rendered-field-item{margin:.5rem 0}.rendered-field-item>.rendered-el.rendered-field-key,.rendered-field-key{font-weight:600}.rendered-field-item>.rendered-el.rendered-field-key+.rendered-el,.rendered-field-item>.rendered-el.rendered-field-key+.rendered-el-virtual-text{margin-top:.15rem}.rendered-field-value-fillable .rendered-field-fillable-slot{border-bottom:1px solid color-mix(in srgb, var(--text) 55%, transparent);vertical-align:bottom;min-width:6rem;min-height:1.25em;display:inline-block}.rendered-field-hint{color:var(--muted);font-size:.85em;font-style:italic}.rendered-field-heading{color:var(--text)}.rendered-checkbox{vertical-align:middle;accent-color:var(--kind-field);margin:0 .25rem 0 0}.rendered-checkbox-wrap{display:inline}", Zr = /* @__PURE__ */ new Set([
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
]), Qr = /* @__PURE__ */ new Set([
	"bold",
	"italic",
	"underline",
	"strikethrough",
	"superscript",
	"subscript",
	"handwriting",
	"rtl",
	"content"
]), $r = {
	bold: "strong",
	italic: "em",
	underline: "u",
	strikethrough: "s",
	superscript: "sup",
	subscript: "sub"
}, ei = "Picture asset not available", ti = "data:image/png;base64,NOT_A_VALID_IMAGE", ni = /^data:image\/(png|jpe?g|webp|gif);base64,/i, ri = 2097152;
function ii(e, t) {
	t.setAttribute("data-doclang-layer", Rt(e));
}
function ai(e, t) {
	if (!e) return null;
	let n = e.trim();
	return n ? ni.test(n) ? n.length <= ri ? n : null : /^[a-z][a-z0-9+.-]*:/i.test(n) || n.startsWith("//") ? null : t?.get(At(n)) ?? null : null;
}
function oi(e) {
	e.classList.add("rendered-picture-unavailable"), e.alt = "\xA0", e.setAttribute("aria-label", ei);
}
function si(e, t, n, r, i) {
	let a = document.createElement("img");
	e.appendChild(a);
	let o = t ? ai(t, i) : null;
	o ? (a.alt = "", a.src = o, a.addEventListener("error", () => oi(a), { once: !0 })) : (oi(a), a.src = ti), n && e.appendChild(li(n, r, "figcaption", i));
}
function ci(e) {
	return I(e).find((e) => L(e) === "caption") ?? null;
}
function li(e, t, n, r) {
	let i = document.createElement(n);
	i.classList.add("rendered-el", "rendered-caption");
	let a = t.get(e);
	return a && i.setAttribute("data-element-id", a), Y(i, e, t, { inline: !0 }, r), i;
}
function J(e, t, n, r) {
	let i = L(e), a = document.createElement("div");
	return a.className = `rendered-el rendered-${i}${r ? ` ${r}` : ""}`, n && a.setAttribute("data-element-id", n), ii(e, a), a.appendChild(t), a;
}
function Y(e, t, n, r, i) {
	let a = [...t.childNodes], o = Pt(a, 0);
	for (; o < a.length;) Ii(e, a[o], n, r, i), o += 1;
}
function ui(e, t, n, r) {
	let i = [...t.childNodes], a = Pt(i, 0);
	for (; a < i.length;) {
		let t = i[a];
		if (t.nodeType === Node.ELEMENT_NODE && Zr.has(L(t))) {
			let i = X(t, n, { inline: !1 }, r);
			i && e.appendChild(i);
		} else Ii(e, t, n, { inline: !1 }, r);
		a += 1;
	}
}
function di(e, t, n, r) {
	let i = document.createElement("span");
	i.className = "rendered-marker rendered-el";
	let a = t.get(e);
	return a && i.setAttribute("data-element-id", a), Y(i, e, t, n, r), i;
}
function fi(e, t) {
	let n = document.createElement("input");
	n.type = "checkbox", n.disabled = !0, n.checked = (e.getAttribute("class") ?? "unselected") === "selected", n.className = "rendered-checkbox";
	let r = document.createElement("span");
	r.className = "rendered-checkbox-wrap rendered-el";
	let i = t.get(e);
	return i && r.setAttribute("data-element-id", i), ii(e, r), r.appendChild(n), r;
}
function pi(e, t, n, r) {
	let i = document.createElement("span");
	i.className = "rendered-field-key rendered-el";
	let a = t.get(e);
	return a && i.setAttribute("data-element-id", a), ii(e, i), Y(i, e, t, {
		...n,
		inline: !0
	}, r), i;
}
function mi(e, t, n, r) {
	let i = e.getAttribute("class") ?? "read_only", a = document.createElement("span");
	a.className = `rendered-field-value rendered-field-value-${i} rendered-el`;
	let o = t.get(e);
	if (o && a.setAttribute("data-element-id", o), ii(e, a), Y(a, e, t, {
		...n,
		inline: !0
	}, r), i === "fillable" && !a.textContent?.trim() && !a.querySelector(".rendered-checkbox-wrap, img, .rendered-marker")) {
		let e = document.createElement("span");
		e.className = "rendered-field-fillable-slot", e.setAttribute("aria-hidden", "true"), a.appendChild(e);
	}
	return a;
}
function hi(e, t, n, r) {
	let i = document.createElement("span");
	i.className = "rendered-field-hint rendered-el";
	let a = t.get(e);
	return a && i.setAttribute("data-element-id", a), ii(e, i), Y(i, e, t, {
		...n,
		inline: !0
	}, r), i;
}
function gi(e, t, n, r) {
	let i = L(e);
	if (i === "content") {
		let t = document.createElement("span");
		return t.textContent = e.textContent ?? "", t;
	}
	let a;
	return i === "handwriting" ? (a = document.createElement("span"), a.className = "rendered-handwriting") : i === "rtl" ? (a = document.createElement("bdi"), a.setAttribute("dir", "rtl")) : a = document.createElement($r[i] ?? "span"), Y(a, e, t, n, r), a;
}
function _i(e, t, n, r) {
	let i = I(e).find((e) => L(e) === "label")?.getAttribute("value"), a = document.createElement("code");
	if (Y(a, e, t, { inline: n.inline }, r), n.inline) {
		a.classList.add("rendered-el");
		let n = t.get(e);
		return n && a.setAttribute("data-element-id", n), a;
	}
	let o = document.createElement("pre");
	if (i && i !== "undefined") {
		let e = document.createElement("span");
		e.className = "rendered-code-label", e.textContent = i, o.appendChild(e);
	}
	return o.appendChild(a), J(e, o, t.get(e));
}
function vi(e, t, n, r) {
	let i = document.createElement("span");
	if (i.className = n.inline ? "rendered-formula-inline" : "rendered-formula", Y(i, e, t, { inline: !0 }, r), n.inline) {
		i.classList.add("rendered-el");
		let n = t.get(e);
		return n && i.setAttribute("data-element-id", n), i;
	}
	return J(e, i, t.get(e));
}
function yi(e, t, n) {
	let r = document.createElement("figure"), i = ci(e);
	si(r, (I(e).find((e) => L(e) === "src") ?? null)?.getAttribute("uri")?.trim() || null, i, t, n);
	let a = [...e.childNodes], o = Pt(a, 0);
	for (; o < a.length;) {
		let e = a[o];
		if (e.nodeType !== Node.ELEMENT_NODE) {
			o += 1;
			continue;
		}
		let i = L(e);
		if (i === "src") {
			o += 1;
			continue;
		}
		if (i === "tabular") {
			let i = Pi(e, t, n);
			i && r.appendChild(i), o += 1;
			continue;
		}
		break;
	}
	let s = document.createElement("div");
	if (s.className = "rendered-picture-contents-body", bi(s, a, o, t, n), s.textContent?.trim()) {
		let e = document.createElement("details");
		e.className = "rendered-picture-contents";
		let t = document.createElement("summary");
		t.textContent = "Picture contents", e.appendChild(t), e.appendChild(s), r.appendChild(e);
	}
	return J(e, r, t.get(e));
}
function bi(e, t, n, r, i) {
	let a = n;
	for (; a < t.length;) {
		let n = t[a];
		if (n.nodeType === Node.ELEMENT_NODE && Zr.has(L(n))) {
			let t = X(n, r, { inline: !1 }, i);
			t && e.appendChild(t);
		} else Ii(e, n, r, { inline: !1 }, i);
		a += 1;
	}
}
function xi(e, t, n, r) {
	let i = t.some((e) => e.nodeType === Node.ELEMENT_NODE && Zr.has(L(e))), a = document.createElement(i ? "div" : "p");
	for (let e of t) if (e.nodeType === Node.ELEMENT_NODE && Zr.has(L(e))) {
		let t = X(e, n, { inline: !1 }, r);
		t && a.appendChild(t);
	} else Ii(a, e, n, { inline: !0 }, r);
	let o = document.createElement("div");
	o.className = "rendered-el rendered-text rendered-el-virtual-text";
	let s = n.get(e);
	return s && o.setAttribute("data-element-id", s), ii(e, o), o.appendChild(a), o;
}
function Si(e) {
	for (let t = 0; t < e.length; t += 1) {
		let n = e[t];
		if (n && (P(n) && !F(n) || n.nodeType === Node.ELEMENT_NODE)) return !0;
	}
	return !1;
}
function Ci(e) {
	if (F(e)) return !0;
	if (e.nodeType !== Node.ELEMENT_NODE) return !1;
	let t = L(e);
	return t === "location" || M.has(t);
}
function wi(e) {
	if (!Si(e)) return !1;
	for (let t of e) if (!Ci(t) && (P(t) || t.nodeType === Node.ELEMENT_NODE && !Ft(t))) return !0;
	return !1;
}
function Ti(e, t, n, r, i) {
	if (Si(n)) {
		if (wi(n)) {
			e.appendChild(xi(t, n, r, i));
			return;
		}
		for (let t of n) if (!Ci(t)) {
			if (t.nodeType === Node.ELEMENT_NODE && Zr.has(L(t))) {
				let n = X(t, r, { inline: !1 }, i);
				n && e.appendChild(n);
			} else Ii(e, t, r, { inline: !0 }, i);
		}
	}
}
function Ei(e, t, n, r) {
	let i = [...t.childNodes], a = xt(i, 0);
	for (; a < i.length;) {
		let t = i[a];
		if (t.nodeType !== Node.ELEMENT_NODE || L(t) !== "ldiv") {
			a += 1;
			continue;
		}
		let o = t;
		a += 1;
		let s = document.createElement("li");
		for (let e of I(o)) {
			let t = L(e);
			t === "marker" ? s.appendChild(di(e, n, { inline: !0 }, r)) : t === "checkbox" && s.appendChild(fi(e, n));
		}
		let c = a, l = R(i, a);
		for (l && (a = l.nextIndex); a < i.length;) {
			let e = i[a];
			if (e.nodeType === Node.ELEMENT_NODE && L(e) === "ldiv") break;
			a += 1;
		}
		Ti(s, o, i.slice(c, a), n, r), e.appendChild(s);
	}
}
function Di(e, t, n) {
	let r = e.getAttribute("class") ?? "unordered", i = document.createElement(r === "ordered" ? "ol" : "ul");
	return Ei(i, e, t, n), J(e, i, t.get(e));
}
function Oi(e) {
	return e === "ched" || e === "rhed" || e === "corn" || e === "srow";
}
function ki(e) {
	let t = [...e.childNodes], n = Nt(t, 0), r = [], i = [];
	for (; n < t.length;) {
		let e = t[n];
		if (e.nodeType !== Node.ELEMENT_NODE) {
			n += 1;
			continue;
		}
		let a = L(e);
		if (a === "nl") {
			r.push(i), i = [], n += 1;
			continue;
		}
		if (!B(a)) {
			n += 1;
			continue;
		}
		if (_t.has(a)) {
			i.push({
				kind: a,
				token: e,
				contentNodes: []
			}), n += 1;
			continue;
		}
		n += 1;
		let o = R(t, n);
		o && (n = o.nextIndex);
		let s = n;
		n = Ct(t, n), i.push({
			kind: a,
			token: e,
			contentNodes: t.slice(s, n)
		});
	}
	return i.length && r.push(i), r;
}
function Ai(e, t, n) {
	for (let r = t - 1; r >= 0; --r) {
		let t = e[r]?.[n];
		if (!(!t || t.covered)) return {
			cell: t,
			row: r,
			col: n
		};
	}
	return null;
}
function ji(e, t, n) {
	for (let r = n - 1; r >= 0; --r) {
		let n = e[t]?.[r];
		if (!(!n || n.covered)) return {
			cell: n,
			row: t,
			col: r
		};
	}
	return null;
}
function Mi(e, t, n) {
	let r = n;
	for (; e[t]?.[r]?.covered;) r += 1;
	return r;
}
function Ni(e) {
	let t = [];
	for (let n = 0; n < e.length; n += 1) {
		t[n] || (t[n] = []);
		let r = 0;
		for (let i of e[n]) {
			if (r = Mi(t, n, r), i.kind === "lcel") {
				let e = ji(t, n, r);
				e && (e.cell.colspan += 1), t[n][r] = {
					kind: "lcel",
					token: i.token,
					contentNodes: [],
					colspan: 0,
					rowspan: 0,
					covered: !0
				}, r += 1;
				continue;
			}
			if (i.kind === "ucel") {
				let e = Ai(t, n, r);
				e && (e.cell.rowspan += 1), t[n][r] = {
					kind: "ucel",
					token: i.token,
					contentNodes: [],
					colspan: 0,
					rowspan: 0,
					covered: !0
				}, r += 1;
				continue;
			}
			if (i.kind === "xcel") {
				let e = Ai(t, n, r), a = ji(t, n, r);
				e && a && e.cell === a.cell ? (e.cell.rowspan += 1, e.cell.colspan += 1) : (e && (e.cell.rowspan += 1), a && (a.cell.colspan += 1)), t[n][r] = {
					kind: "xcel",
					token: i.token,
					contentNodes: [],
					colspan: 0,
					rowspan: 0,
					covered: !0
				}, r += 1;
				continue;
			}
			t[n][r] = {
				kind: i.kind,
				token: i.token,
				contentNodes: i.contentNodes,
				colspan: 1,
				rowspan: 1,
				covered: !1
			}, r += 1;
		}
	}
	return t;
}
function Pi(e, t, n) {
	let r = document.createElement("table");
	r.className = "rendered-table";
	let i = ci(e);
	i && r.appendChild(li(i, t, "caption", n));
	let a = Ni(ki(e)), o = document.createElement("tbody");
	for (let e of a) {
		let r = document.createElement("tr");
		for (let i of e ?? []) {
			if (!i || i.covered) continue;
			let e = Oi(i.kind) ? "th" : "td", a = document.createElement(e);
			i.colspan > 1 && (a.colSpan = i.colspan), i.rowspan > 1 && (a.rowSpan = i.rowspan), Ti(a, i.token, i.contentNodes, t, n), r.appendChild(a);
		}
		r.childNodes.length && o.appendChild(r);
	}
	return o.childNodes.length && r.appendChild(o), J(e, r, t.get(e));
}
function Fi(e, t) {
	let n = document.createElement("div");
	return n.className = "rendered-unsupported", n.textContent = `<${L(e)}> — not yet rendered`, J(e, n, t.get(e));
}
function X(e, t, n, r) {
	let i = L(e), a = t.get(e);
	switch (i) {
		case "text": {
			let n = document.createElement("p");
			return Y(n, e, t, { inline: !0 }, r), J(e, n, a);
		}
		case "heading": {
			let n = document.createElement(`h${Tt(e)}`);
			return Y(n, e, t, { inline: !0 }, r), J(e, n, a);
		}
		case "field_heading": {
			let n = document.createElement(`h${Tt(e)}`);
			return n.className = "rendered-field-heading", Y(n, e, t, { inline: !0 }, r), J(e, n, a);
		}
		case "footnote": {
			let n = document.createElement("aside");
			return Y(n, e, t, { inline: !1 }, r), J(e, n, a);
		}
		case "page_header": {
			let n = document.createElement("header");
			return n.className = "rendered-page-header", Y(n, e, t, { inline: !0 }, r), J(e, n, a);
		}
		case "page_footer": {
			let n = document.createElement("footer");
			return n.className = "rendered-page-footer", Y(n, e, t, { inline: !0 }, r), J(e, n, a);
		}
		case "list": return Di(e, t, r);
		case "table":
		case "index":
		case "tabular": return Pi(e, t, r);
		case "code": return _i(e, t, n, r);
		case "formula": return vi(e, t, n, r);
		case "picture": return yi(e, t, r);
		case "group": {
			let n = document.createElement("figure");
			n.className = "rendered-group", ui(n, e, t, r);
			let i = ci(e);
			return i && n.appendChild(li(i, t, "figcaption", r)), J(e, n, a);
		}
		case "field_region": {
			let n = document.createElement("div");
			return n.className = "rendered-field-region", ui(n, e, t, r), J(e, n, a);
		}
		case "field_item": {
			let n = document.createElement("div");
			return n.className = "rendered-field-item", ui(n, e, t, r), J(e, n, a);
		}
		default: return Fi(e, t);
	}
}
function Ii(e, t, n, r, i) {
	if (P(t)) {
		let n = t.textContent;
		if (!n || !n.trim() || r.trimLeading && (n = n.replace(/^\s+/u, ""), r.trimLeading = !1, !n)) return;
		e.appendChild(document.createTextNode(n));
		return;
	}
	if (t.nodeType !== Node.ELEMENT_NODE) return;
	let a = t, o = L(a);
	if (!M.has(o)) {
		if (Qr.has(o)) {
			e.appendChild(gi(a, n, r, i));
			return;
		}
		if (o === "code" || o === "formula") {
			let t = X(a, n, { inline: !0 }, i);
			t && e.appendChild(t);
			return;
		}
		if (Zr.has(o)) {
			let t = X(a, n, r, i);
			t && e.appendChild(t);
			return;
		}
		if (o === "marker") {
			e.appendChild(di(a, n, r, i));
			return;
		}
		if (o === "checkbox") {
			e.appendChild(fi(a, n));
			return;
		}
		if (o === "key") {
			e.appendChild(pi(a, n, r, i));
			return;
		}
		if (o === "value") {
			e.appendChild(mi(a, n, r, i));
			return;
		}
		if (o === "hint") {
			e.appendChild(hi(a, n, r, i));
			return;
		}
		o !== "ldiv" && (B(o) || o === "src" || o === "tabular" || Y(e, a, n, r, i));
	}
}
function Li(e) {
	if (P(e)) return e;
	if (e.nodeType !== Node.ELEMENT_NODE) return null;
	for (let t = e.childNodes.length - 1; t >= 0; --t) {
		let n = Li(e.childNodes[t]);
		if (n) return n;
	}
	return null;
}
function Ri(e) {
	let t = Li(e);
	if (!t) return;
	let n = t.textContent ?? "";
	if (n = n.replace(/\s+$/u, ""), n.endsWith("-") && (n = n.slice(0, -1)), !n) {
		t.parentNode?.removeChild(t), Ri(e);
		return;
	}
	t.textContent = n;
}
function zi(e, t, n, r) {
	for (let i = 0; i < t.length; i += 1) i > 0 && Ri(e), Y(e, t[i], n, {
		inline: !0,
		trimLeading: i > 0
	}, r);
}
function Bi(e, t, n) {
	let r = e[0], i = L(r), a = t.get(r), o = Lt(r), s;
	if (i === "text") s = document.createElement("p"), zi(s, e, t, n);
	else if (i === "list") {
		let i = r.getAttribute("class") ?? "unordered";
		s = document.createElement(i === "ordered" ? "ol" : "ul");
		for (let r of e) Ei(s, r, t, n);
	} else {
		s = document.createElement("div"), s.className = "rendered-fragment-merged-body";
		for (let r of e) ui(s, r, t, n);
	}
	let c = J(r, s, a, "rendered-fragment-merged");
	return o && c.setAttribute("data-thread-id", o), c;
}
function Vi(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (n.nodeType !== Node.ELEMENT_NODE || L(n) === "page_break") continue;
		let e = Lt(n);
		e && (t.has(e) || t.set(e, []), t.get(e).push(n));
	}
	for (let [e, n] of t) n.length < 2 && t.delete(e);
	return t;
}
var Z = class extends U {
	constructor(...e) {
		super(...e), this._showFurniture = !0, this._showBackground = !0, this._settingsOpen = !1, this._visible = !1, this._pageController = new $n(this, () => this.scrollPane), this._hasMarkup = null, this._pendingContent = null, this._settingsPanelRef = A(), this._onContentRef = (e) => {
			e && this._pendingContent && e.replaceChildren(this._pendingContent);
		}, this._onSettingsToggle = () => {
			this._settingsOpen = !this._settingsOpen, this._settingsPanelRef.value?.setOpen(this._settingsOpen), this.requestUpdate();
		}, this._onSettingsClose = () => {
			this._settingsOpen = !1, this.requestUpdate();
		}, this._onFurnitureChange = (e) => {
			this._showFurniture = e.target.checked, this.dispatchEvent(new CustomEvent("doclang-show-reading-furniture", {
				bubbles: !0,
				composed: !0,
				detail: { checked: this._showFurniture }
			}));
		}, this._onBackgroundChange = (e) => {
			this._showBackground = e.target.checked, this.dispatchEvent(new CustomEvent("doclang-show-reading-background", {
				bubbles: !0,
				composed: !0,
				detail: { checked: this._showBackground }
			}));
		}, this._onBodyClick = (e) => {
			let t = e.target, n = t.closest(".rendered-el-virtual-text"), r = n?.hasAttribute("data-element-id") ? n.getAttribute("data-element-id") : t.closest(".rendered-el[data-element-id]")?.getAttribute("data-element-id") ?? null;
			r && this.dispatchEvent(new CustomEvent("doclang-element-select", {
				bubbles: !0,
				composed: !0,
				detail: { id: r }
			}));
		};
	}
	static {
		this.styles = s(Xr);
	}
	connectedCallback() {
		super.connectedCallback(), this.classList.add("pane", "pane-reading");
	}
	render() {
		let e = {
			"pane-body": !0,
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
              @click=${this._onSettingsToggle}
            >
              Layers
            </button>` : C}
      </div>
      <div class="pane-reading-layout">
        <div
          id="rendered-pane"
          class=${W(e)}
          @click=${this._onBodyClick}
        >
          ${this._hasMarkup === !1 ? b`<div class="placeholder">${fn}</div>` : this._hasMarkup === !0 ? b`<div ${j(this._onContentRef)}></div>` : C}
        </div>
        ${this._visible ? b`
              <doclang-settings-panel
                ${j(this._settingsPanelRef)}
                label="Layers"
                @doclang-settings-close=${this._onSettingsClose}
              >
                <div class="settings-subgroup">
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
              </doclang-settings-panel>
            ` : C}
      </div>
    `;
	}
	updated(e) {
		if (super.updated(e), !this._pendingContent) return;
		let t = this.shadowRoot?.querySelector(".pane-body > div");
		t && !t.contains(this._pendingContent) && t.replaceChildren(this._pendingContent);
	}
	get scrollPane() {
		return this.shadowRoot?.querySelector(".pane-body") ?? null;
	}
	setVisible(e) {
		this._visible = e, this.hidden = !e, this.requestUpdate();
	}
	_applySelection() {
		if (!this.shadowRoot) return;
		for (let e of this.shadowRoot.querySelectorAll(".rendered-el.selected")) e.classList.remove("selected");
		if (!this.selected) return;
		let e = this._findRenderedElement(this.selected, this._peerIds);
		e && (this._revealContext(e), e.classList.add("selected"), e.scrollIntoView({
			block: "nearest",
			behavior: "smooth"
		}));
	}
	_renderDocument() {
		let e = this._docState;
		if (!e) {
			this._pendingContent = null, this._hasMarkup = null;
			return;
		}
		let t = e.segments[this.page - 1] ?? [], n = e.elementIds.size ? e.elementIds : _n(t);
		e.elementIds = n, hn(t) ? (this._pendingContent = this._buildRenderedArticle(t, n), this._hasMarkup = !0) : (this._pendingContent = null, this._hasMarkup = !1), this.requestUpdate();
	}
	_clearDocument() {
		this._pendingContent = null, this._hasMarkup = null, this.requestUpdate();
	}
	_buildRenderedArticle(e, t) {
		let n = this._docState?.assetUrls, r = Vi(e), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Map();
		for (let [, e] of r) {
			a.set(e[0], e);
			for (let t = 1; t < e.length; t += 1) i.add(e[t]);
		}
		let o = document.createElement("article");
		o.className = "rendered-doc";
		for (let r of e) {
			if (r.nodeType !== Node.ELEMENT_NODE || L(r) === "page_break" || i.has(r)) continue;
			let e = a.get(r), s = e ? Bi(e, t, n) : X(r, t, { inline: !1 }, n);
			s && o.appendChild(s);
		}
		return o;
	}
	_findRenderedElement(e, t) {
		if (!this.shadowRoot) return null;
		let n = this.shadowRoot.querySelector(`.rendered-el-virtual-text[data-element-id="${e}"]`) ?? this.shadowRoot.querySelector(`.rendered-el[data-element-id="${e}"]`);
		if (n) return n;
		let r = this._docState?.idToElement?.get(e), i = r ? Lt(r) : null;
		if (!i) return null;
		let a = this.shadowRoot.querySelector(`.rendered-fragment-merged[data-thread-id="${i}"]`);
		if (!a) return null;
		let o = a.getAttribute("data-element-id");
		return !o || o === e || t.has(e) ? a : null;
	}
	_revealContext(e) {
		let t = e.closest(".rendered-picture-contents");
		t && !t.open && (t.open = !0), this._revealLayer(e);
	}
	_revealLayer(e) {
		let t = e.getAttribute("data-doclang-layer");
		!t || t === "body" || (t === "furniture" && !this._showFurniture ? (this._showFurniture = !0, this.dispatchEvent(new CustomEvent("doclang-show-reading-furniture", {
			bubbles: !0,
			composed: !0,
			detail: { checked: !0 }
		}))) : t === "background" && !this._showBackground && (this._showBackground = !0, this.dispatchEvent(new CustomEvent("doclang-show-reading-background", {
			bubbles: !0,
			composed: !0,
			detail: { checked: !0 }
		}))));
	}
};
H([O()], Z.prototype, "_showFurniture", void 0), H([O()], Z.prototype, "_showBackground", void 0), H([O()], Z.prototype, "_settingsOpen", void 0), H([O()], Z.prototype, "_visible", void 0), H([O()], Z.prototype, "_hasMarkup", void 0), Z = H([E("doclang-reading-pane")], Z);
//#endregion
//#region src/components/viewer/empty.css?inline
var Hi = ":host{--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark;--bg:var(--doclang-bg,#f4f4f5);--panel:var(--doclang-panel,#fff);--border:var(--doclang-border,#d4d4d8);--text:var(--doclang-text,#18181b);--muted:var(--doclang-muted,#71717a);--accent:var(--doclang-accent,#2563eb);--placeholder-bg:var(--doclang-placeholder-bg,#fafafa);--font-ui:var(--doclang-font-ui,system-ui, -apple-system, \"Segoe UI\", sans-serif);--font-mono:var(--doclang-font-mono,ui-monospace, \"Cascadia Code\", \"Source Code Pro\", monospace);--markup-bg:var(--doclang-markup-bg,#fff);--markup-fg:var(--doclang-markup-fg,#24292e);--markup-hover:var(--doclang-markup-hover,#2563eb14);--markup-selected:var(--doclang-markup-selected,#2563eb24);--kind-text:var(--doclang-kind-text,#2563eb);--kind-heading:var(--doclang-kind-heading,#7c3aed);--kind-list:var(--doclang-kind-list,#ea580c);--kind-ldiv:var(--doclang-kind-ldiv,#ea580c);--kind-table:var(--doclang-kind-table,#16a34a);--kind-index:var(--doclang-kind-index,#0d9488);--kind-formula:var(--doclang-kind-formula,#0891b2);--kind-code:var(--doclang-kind-code,#475569);--kind-picture:var(--doclang-kind-picture,#db2777);--kind-group:var(--doclang-kind-group,#4f46e5);--kind-footnote:var(--doclang-kind-footnote,#a16207);--kind-page_header:var(--doclang-kind-page_header,#71717a);--kind-page_footer:var(--doclang-kind-page_footer,#71717a);--kind-caption:var(--doclang-kind-caption,#71717a);--kind-field:var(--doclang-kind-field,#d97706);--kind-default:var(--doclang-kind-default,#dc2626)}@media (prefers-color-scheme:dark){:host{--lightningcss-light: ;--lightningcss-dark:initial;--bg:var(--doclang-bg,#09090b);--panel:var(--doclang-panel,#18181b);--border:var(--doclang-border,#3f3f46);--text:var(--doclang-text,#fafafa);--muted:var(--doclang-muted,#a1a1aa);--placeholder-bg:var(--doclang-placeholder-bg,#27272a);--markup-bg:var(--doclang-markup-bg,#1e1e1e);--markup-fg:var(--doclang-markup-fg,#d4d4d4);--markup-hover:var(--doclang-markup-hover,#60a5fa1a);--markup-selected:var(--doclang-markup-selected,#60a5fa2e);--kind-text:var(--doclang-kind-text,#60a5fa);--kind-heading:var(--doclang-kind-heading,#a78bfa);--kind-list:var(--doclang-kind-list,#fb923c);--kind-ldiv:var(--doclang-kind-ldiv,#fb923c);--kind-table:var(--doclang-kind-table,#4ade80);--kind-index:var(--doclang-kind-index,#2dd4bf);--kind-formula:var(--doclang-kind-formula,#22d3ee);--kind-code:var(--doclang-kind-code,#94a3b8);--kind-picture:var(--doclang-kind-picture,#f472b6);--kind-group:var(--doclang-kind-group,#818cf8);--kind-footnote:var(--doclang-kind-footnote,#facc15);--kind-page_header:var(--doclang-kind-page_header,#a1a1aa);--kind-page_footer:var(--doclang-kind-page_footer,#a1a1aa);--kind-caption:var(--doclang-kind-caption,#a1a1aa);--kind-field:var(--doclang-kind-field,#fbbf24);--kind-default:var(--doclang-kind-default,#f87171)}}:host{display:contents}.empty-state{border:2px dashed var(--border);background:var(--placeholder-bg);text-align:center;min-height:0;color:var(--muted);border-radius:.75rem;flex:1 1 0;justify-content:center;align-items:center;margin:1rem;padding:2rem 1.5rem;display:flex}.empty-state-inner{max-width:28rem}.empty-state-loading{flex-direction:column;align-items:center;display:none}:host(.demo-loading) .empty-state-loading{display:flex}:host(.demo-loading) .empty-state-prompt{display:none}.loading-spinner{border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;width:2rem;height:2rem;margin:0 auto 1rem;animation:.7s linear infinite loading-spin}@keyframes loading-spin{to{transform:rotate(360deg)}}.empty-state-title{color:var(--text);margin:0 0 .75rem;font-size:1.05rem}.empty-state p{margin:.5rem 0}.empty-state-action{margin:0 0 .75rem}.text-link{color:var(--accent);text-decoration:underline}.text-link:hover{opacity:.85}.empty-state-meta{font-size:.875rem}code{font-family:var(--font-mono)}", Ui = class extends T {
	constructor(...e) {
		super(...e), this._extensions = [];
	}
	static {
		this.styles = s(Hi);
	}
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
                >${this._extensions.map((e, t) => b`${t > 0 ? ", " : ""}<code>${e}</code>`)}</span
              >
            </p>
            <p class="empty-state-action">
              or
              <a
                href="#"
                class="text-link"
                @click=${(e) => {
			e.preventDefault(), this.dispatchEvent(new CustomEvent("doclang-load-demo", {
				bubbles: !0,
				composed: !0
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
	setFileTypeHints(e) {
		this._extensions = e, this.requestUpdate();
	}
	setDemoLoading(e) {
		this.classList.toggle("demo-loading", e);
	}
};
Ui = H([E("doclang-empty")], Ui);
//#endregion
//#region src/components/container/pane-stack.ts
var Wi = class extends U {
	constructor(...e) {
		super(...e), this._onChildViewPage = (e) => {
			if (e.target === this) return;
			let t = e.detail.page;
			e.stopPropagation(), this.page = t;
		};
	}
	connectedCallback() {
		super.connectedCallback(), this.addEventListener("view-page", this._onChildViewPage);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.removeEventListener("view-page", this._onChildViewPage);
	}
	render() {
		return b`<slot></slot>`;
	}
	_renderDocument() {
		this._pushToChildren();
	}
	_clearDocument() {
		this._pushToChildren();
	}
	_applySelection() {
		this._pushSelectedToChildren();
	}
	_children() {
		return Array.from(this.children).filter((e) => e instanceof U);
	}
	_pushToChildren() {
		for (let e of this._children()) e.document = this._docState, e.page = this.page, e.selected = this.selected ?? null;
	}
	_pushSelectedToChildren() {
		for (let e of this._children()) e.selected = this.selected ?? null;
	}
};
Wi = H([E("doclang-pane-stack")], Wi);
//#endregion
//#region node_modules/lit-html/directives/style-map.js
var Gi = "important", Ki = " !important", qi = nt(class extends rt {
	constructor(e) {
		if (super(e), e.type !== tt.ATTRIBUTE || e.name !== "style" || e.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
	}
	render(e) {
		return Object.keys(e).reduce((t, n) => {
			let r = e[n];
			return r == null ? t : t + `${n = n.includes("-") ? n : n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${r};`;
		}, "");
	}
	update(e, [t]) {
		let { style: n } = e.element;
		if (this.ft === void 0) return this.ft = new Set(Object.keys(t)), this.render(t);
		for (let e of this.ft) t[e] ?? (this.ft.delete(e), e.includes("-") ? n.removeProperty(e) : n[e] = null);
		for (let e in t) {
			let r = t[e];
			if (r != null) {
				this.ft.add(e);
				let t = typeof r == "string" && r.endsWith(Ki);
				e.includes("-") || t ? n.setProperty(e, t ? r.slice(0, -11) : r, t ? Gi : "") : n[e] = r;
			}
		}
		return S;
	}
}), Ji = ":host{--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark;--bg:var(--doclang-bg,#f4f4f5);--panel:var(--doclang-panel,#fff);--border:var(--doclang-border,#d4d4d8);--text:var(--doclang-text,#18181b);--muted:var(--doclang-muted,#71717a);--accent:var(--doclang-accent,#2563eb);--placeholder-bg:var(--doclang-placeholder-bg,#fafafa);--font-ui:var(--doclang-font-ui,system-ui, -apple-system, \"Segoe UI\", sans-serif);--font-mono:var(--doclang-font-mono,ui-monospace, \"Cascadia Code\", \"Source Code Pro\", monospace);--markup-bg:var(--doclang-markup-bg,#fff);--markup-fg:var(--doclang-markup-fg,#24292e);--markup-hover:var(--doclang-markup-hover,#2563eb14);--markup-selected:var(--doclang-markup-selected,#2563eb24);--kind-text:var(--doclang-kind-text,#2563eb);--kind-heading:var(--doclang-kind-heading,#7c3aed);--kind-list:var(--doclang-kind-list,#ea580c);--kind-ldiv:var(--doclang-kind-ldiv,#ea580c);--kind-table:var(--doclang-kind-table,#16a34a);--kind-index:var(--doclang-kind-index,#0d9488);--kind-formula:var(--doclang-kind-formula,#0891b2);--kind-code:var(--doclang-kind-code,#475569);--kind-picture:var(--doclang-kind-picture,#db2777);--kind-group:var(--doclang-kind-group,#4f46e5);--kind-footnote:var(--doclang-kind-footnote,#a16207);--kind-page_header:var(--doclang-kind-page_header,#71717a);--kind-page_footer:var(--doclang-kind-page_footer,#71717a);--kind-caption:var(--doclang-kind-caption,#71717a);--kind-field:var(--doclang-kind-field,#d97706);--kind-default:var(--doclang-kind-default,#dc2626)}@media (prefers-color-scheme:dark){:host{--lightningcss-light: ;--lightningcss-dark:initial;--bg:var(--doclang-bg,#09090b);--panel:var(--doclang-panel,#18181b);--border:var(--doclang-border,#3f3f46);--text:var(--doclang-text,#fafafa);--muted:var(--doclang-muted,#a1a1aa);--placeholder-bg:var(--doclang-placeholder-bg,#27272a);--markup-bg:var(--doclang-markup-bg,#1e1e1e);--markup-fg:var(--doclang-markup-fg,#d4d4d4);--markup-hover:var(--doclang-markup-hover,#60a5fa1a);--markup-selected:var(--doclang-markup-selected,#60a5fa2e);--kind-text:var(--doclang-kind-text,#60a5fa);--kind-heading:var(--doclang-kind-heading,#a78bfa);--kind-list:var(--doclang-kind-list,#fb923c);--kind-ldiv:var(--doclang-kind-ldiv,#fb923c);--kind-table:var(--doclang-kind-table,#4ade80);--kind-index:var(--doclang-kind-index,#2dd4bf);--kind-formula:var(--doclang-kind-formula,#22d3ee);--kind-code:var(--doclang-kind-code,#94a3b8);--kind-picture:var(--doclang-kind-picture,#f472b6);--kind-group:var(--doclang-kind-group,#818cf8);--kind-footnote:var(--doclang-kind-footnote,#facc15);--kind-page_header:var(--doclang-kind-page_header,#a1a1aa);--kind-page_footer:var(--doclang-kind-page_footer,#a1a1aa);--kind-caption:var(--doclang-kind-caption,#a1a1aa);--kind-field:var(--doclang-kind-field,#fbbf24);--kind-default:var(--doclang-kind-default,#f87171)}}:host{min-height:100vh;font-family:var(--font-ui);background:var(--bg);color:var(--text);flex-direction:column;display:flex}:host(.drag-over){background:color-mix(in srgb, var(--accent) 6%, var(--bg))}:host(.drag-over) doclang-empty{border-color:var(--accent);background:color-mix(in srgb, var(--accent) 8%, var(--placeholder-bg))}header{border-bottom:1px solid var(--border);background:var(--panel);grid-template-columns:1fr auto 1fr;align-items:center;gap:1rem;padding:.75rem 1rem;display:grid}.header-brand{grid-column:1;justify-self:start;align-items:center;gap:1rem;min-width:0;display:flex}header h1{margin:0;font-size:1.1rem;font-weight:600}.header-center{text-align:center;grid-column:2;justify-self:center;min-width:0}.doc-label{color:var(--muted);text-overflow:ellipsis;white-space:nowrap;min-width:0;max-width:min(40vw,28rem);font-size:.8125rem;font-weight:400;overflow:hidden}.header-logo-link{border-radius:.25rem;flex-shrink:0;line-height:0;text-decoration:none;display:block}.header-logo-link:hover{opacity:.8}.header-logo{width:auto;height:2.25rem;display:block}.header-logo-link:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.toolbar-wrap{grid-column:3;justify-self:end}.drop-banner{text-align:center;color:var(--muted);background:color-mix(in srgb, var(--accent) 8%, var(--panel));border-bottom:1px solid var(--border);margin:0;padding:.35rem 1rem;font-size:.8125rem;display:none}:host(.loaded.drag-over) .drop-banner{display:block}:host(.loaded) doclang-empty{display:none}.main{flex:1 1 0;min-height:0;display:none}:host(.loaded) .main{grid-template-rows:minmax(0,1fr);display:grid}:host(.loaded) .main .pane{border-right:none}.pane{border-right:1px solid var(--border);flex-direction:column;min-width:0;min-height:0;display:flex}.pane[hidden]{display:none!important}.pane-splitter{box-sizing:content-box;cursor:col-resize;touch-action:none;z-index:2;background:0 0;width:1px;margin:0 -4px;padding:0 4px;position:relative}.pane-splitter:after{content:\"\";background:var(--border);width:1px;transition:background .15s,width .15s;position:absolute;top:0;bottom:0;left:4px}.pane-splitter:hover:after,.pane-splitter:focus-visible:after,.pane-splitter.is-dragging:after{background:var(--accent);width:3px}.pane-splitter[hidden]{display:none!important}:host(.pane-drag-active){cursor:col-resize;-webkit-user-select:none;user-select:none}:host(.pane-drag-active) .pane-splitter{cursor:col-resize}@media (width<=1200px){:host(.loaded) .main{grid-template-rows:unset;grid-template-columns:1fr!important}:host(.loaded) .main .pane{border-right:none;border-bottom:1px solid var(--border);grid-column:1!important}:host(.loaded) .main .pane-splitter{display:none!important}}", Yi = class {
	constructor(e) {
		this._catalog = [], this._activeIndex = -1, this._host = e, e.addController(this);
	}
	hostConnected() {}
	hostDisconnected() {}
	get entries() {
		return this._catalog.map((e, t) => ({
			label: e.label,
			thumbnailUrl: e.thumbnailUrl,
			isActive: t === this._activeIndex
		}));
	}
	get size() {
		return this._catalog.length;
	}
	get activeIndex() {
		return this._activeIndex;
	}
	get activeEntry() {
		return this._catalog[this._activeIndex] ?? null;
	}
	hasMultiple() {
		return this._catalog.length > 1;
	}
	findCatalogIndexForFile(e) {
		return this._catalog.findIndex((t) => {
			let n = t.source;
			return n instanceof File && n.name === e.name && n.size === e.size && n.lastModified === e.lastModified;
		});
	}
	async addFiles(e, { replace: t = !1 } = {}) {
		t && this._clearAll();
		let n = this._catalog.length, r = null;
		for (let n of e) {
			let e = t ? -1 : this.findCatalogIndexForFile(n);
			if (e !== -1) {
				r === null && (r = e);
				continue;
			}
			let i = this._createEntry(n);
			this._catalog.push(i), this._enrichThumbnail(i), r === null && (r = this._catalog.length - 1);
		}
		return this._catalog.length ? this._switchTo(t ? 0 : r ?? n) : null;
	}
	async addArchiveBuffer(e, t, { replace: n = !1 } = {}) {
		n && this._clearAll();
		let r = {
			id: crypto.randomUUID(),
			label: t,
			kind: "archive",
			source: e,
			currentPage: 1,
			pageZoom: 100,
			snapshot: null,
			thumbnailUrl: null
		};
		return this._catalog.push(r), this._enrichThumbnail(r), this._switchTo(n ? 0 : this._catalog.length - 1);
	}
	async appendFolderArchive(e) {
		if (!e.some((e) => e.name === "document.xml")) return alert("Archive must contain document.xml at its root."), null;
		let t = (e[0].webkitRelativePath || e[0].name).split("/")[0] || "archive", n = {
			id: crypto.randomUUID(),
			label: t,
			kind: "folder",
			source: e,
			currentPage: 1,
			pageZoom: 100,
			snapshot: null,
			thumbnailUrl: null
		};
		return this._catalog.push(n), this._enrichThumbnail(n), this._switchTo(this._catalog.length - 1);
	}
	persistActiveViewState(e, t) {
		let n = this.activeEntry;
		n && (n.currentPage = e, n.pageZoom = t);
	}
	async selectEntry(e) {
		return e < 0 || e >= this._catalog.length ? null : (this._releaseActive(), this._switchTo(e));
	}
	async closeEntry(e) {
		if (e < 0 || e >= this._catalog.length) return {
			doc: null,
			newIndex: -1
		};
		let t = e === this._activeIndex, n = this._catalog[e];
		if (t && (this._releaseActive(), this._activeIndex = -1), this._revoke(n), this._catalog.splice(e, 1), !this._catalog.length) return this._requestUpdate(), {
			doc: null,
			newIndex: -1
		};
		if (t) {
			let t = Math.min(e, this._catalog.length - 1);
			return {
				doc: await this._switchTo(t),
				newIndex: this._activeIndex
			};
		}
		return e < this._activeIndex && --this._activeIndex, this._requestUpdate(), {
			doc: null,
			newIndex: this._activeIndex
		};
	}
	clearAll() {
		this._clearAll(), this._requestUpdate();
	}
	isArchiveFile(e) {
		return /\.dclx$/i.test(e.name) || /\.zip$/i.test(e.name);
	}
	isMarkupFile(e) {
		return /\.(?:dclg(?:\.xml)?|xml)$/i.test(e.name);
	}
	_requestUpdate() {
		this._host.requestUpdate();
	}
	async _switchTo(e) {
		this._activeIndex = e;
		let t = this._catalog[e], n = await this._parse(t);
		return n ? (t.snapshot = n, n) : (this._revoke(t), this._catalog.splice(e, 1), this._activeIndex = -1, this._requestUpdate(), this._catalog.length ? this._switchTo(Math.min(e, this._catalog.length - 1)) : null);
	}
	_releaseActive() {
		let e = this.activeEntry;
		e?.snapshot && (zn(e.snapshot), e.snapshot = null);
	}
	_clearAll() {
		this._releaseActive();
		for (let e of this._catalog) this._revoke(e);
		this._catalog = [], this._activeIndex = -1;
	}
	_revoke(e) {
		e.thumbnailUrl?.startsWith("blob:") && URL.revokeObjectURL(e.thumbnailUrl), e.thumbnailUrl = null;
	}
	_createEntry(e) {
		return {
			id: crypto.randomUUID(),
			label: e.name,
			kind: this.isMarkupFile(e) ? "markup" : "archive",
			source: e,
			currentPage: 1,
			pageZoom: 100,
			snapshot: null,
			thumbnailUrl: null
		};
	}
	_enrichThumbnail(e) {
		this._resolveThumbnail(e).then((t) => {
			if (!this._catalog.includes(e)) {
				t?.startsWith("blob:") && URL.revokeObjectURL(t);
				return;
			}
			t && this._requestUpdate();
		});
	}
	async _resolveThumbnail(e) {
		if (e.thumbnailUrl) return e.thumbnailUrl;
		if (e.kind === "markup") return null;
		try {
			e.kind === "folder" ? e.thumbnailUrl = this._firstPageUrlFromFiles(e.source) : e.kind === "archive" && (e.thumbnailUrl = await this._firstPageUrlFromZip(e.source));
		} catch {
			e.thumbnailUrl = null;
		}
		return e.thumbnailUrl;
	}
	_firstPageUrlFromFiles(e) {
		let t = Infinity, n = null;
		for (let r of e) {
			let e = (r.webkitRelativePath || r.name).split("/");
			if (e.length < 2 || e[e.length - 2] !== "pages") continue;
			let i = dn.exec(r.name);
			if (!i) continue;
			let a = Number(i[1]);
			a < t && (t = a, n = r);
		}
		return n ? URL.createObjectURL(n) : null;
	}
	async _firstPageUrlFromZip(e) {
		let t = await tn(e instanceof File ? await e.arrayBuffer() : e, { shouldExtract: (e) => /^pages\/\d+\.(png|jpe?g|webp)$/i.test(e) }), n = Infinity, r = null;
		for (let e of t) {
			let t = e.name.match(/^pages\/(\d+)\.(png|jpe?g|webp)$/i);
			if (!t) continue;
			let i = Number(t[1]);
			i < n && (n = i, r = e);
		}
		if (!r) return null;
		let i = r.name.split(".").pop() ?? "png";
		return URL.createObjectURL(new Blob([r.data], { type: this._mimeFromExt(i) }));
	}
	_mimeFromExt(e) {
		let t = e.toLowerCase().replace("jpeg", "jpg");
		return t === "png" ? "image/png" : t === "webp" ? "image/webp" : "image/jpeg";
	}
	async _parse(e) {
		try {
			if (e.kind === "markup") return Ln(e.source instanceof File ? await e.source.text() : new TextDecoder().decode(e.source), /* @__PURE__ */ new Map(), e.label, /* @__PURE__ */ new Map(), { markupOnly: !0 });
			if (e.kind === "archive") {
				let { markupXml: t, pageImages: n, assetUrls: r } = await ln(e.source instanceof File ? await e.source.arrayBuffer() : e.source);
				return Ln(t, n, e.label, r, { markupOnly: !1 });
			}
			if (e.kind === "folder") {
				let { markupXml: t, pageImages: n, assetUrls: r } = await Rn(e.source);
				return Ln(t, n, e.label, r, { markupOnly: !1 });
			}
		} catch (t) {
			alert(`Failed to read ${e.label}: ${t.message}`);
		}
		return null;
	}
}, Xi = [".dclx", ".dclg"], Zi = "doclang-viewer-pane-layout", Q = [
	"file",
	"page",
	"markup",
	"reading"
], Qi = .12, $i = [
	1,
	1,
	1,
	1
], ea = [
	"page",
	"markup",
	"reading"
], $ = class extends U {
	constructor(...e) {
		super(...e), this.example = null, this._loaded = !1, this._markupOnly = !1, this._dragOver = !1, this._paneDragActive = !1, this._demoLoading = !1, this._docLabel = null, this._mainGridStyle = {}, this._paneGridCols = /* @__PURE__ */ new Map(), this._splitterCols = [
			null,
			null,
			null
		], this.panes = [...ea], this._collection = new Yi(this), this._filePaneUserToggled = !1, this._paneRatios = [...$i], this._filePaneWidthPx = null, this._paneDrag = null, this._demoLoadInProgress = !1, this._suppressDemoLoad = !1, this._pageNavRef = A(), this._toolbarRef = A(), this._collectionPaneRef = A(), this._markupPaneRef = A(), this._pageViewPaneRef = A(), this._readingPaneRef = A(), this._emptyStateRef = A(), this._splitterRefs = [
			A(),
			A(),
			A()
		], this._mainRef = A(), this._onWindowPointerMove = (e) => {
			let t = this._paneDrag;
			if (!t || e.pointerId !== t.pointerId) return;
			if (t.leftKey === "file" && typeof t.leftStartPx == "number") {
				this._filePaneWidthPx = Math.max(this._filePaneFitWidthPx(), t.leftStartPx + (e.clientX - t.startX)), this._applyPaneLayout();
				return;
			}
			if (t.rightKey === "file" && typeof t.rightStartPx == "number") {
				this._filePaneWidthPx = Math.max(this._filePaneFitWidthPx(), t.rightStartPx - (e.clientX - t.startX)), this._applyPaneLayout();
				return;
			}
			let n = this._visiblePaneKeys(), r = this._contentPaneFrWeights(n), i = n.filter((e) => e !== "file").indexOf(t.leftKey);
			if (i < 0 || i + 1 >= r.length) return;
			let a = r[i] + r[i + 1];
			if (!(a > 0)) return;
			let o = Math.max(this._contentPaneAvailableWidthPx() * a, 1), s = (e.clientX - t.startX) / o, c = this._paneRatioIndex(t.leftKey), l = this._paneRatioIndex(t.rightKey), u = t.leftStart + t.rightStart;
			if (!(u > 0) || c < 0 || l < 0) return;
			let d = Math.min(Qi, u / 2), f = Math.min(Qi, u / 2), p = t.leftStart + s * u;
			p = Math.min(Math.max(p, d), u - f), this._paneRatios[c] = p, this._paneRatios[l] = u - p, this._applyPaneLayout();
		}, this._onWindowPointerUp = (e) => {
			let t = this._paneDrag;
			if (!t || e.pointerId !== t.pointerId) return;
			let n = this._splitterRefs[t.physicalSplitterIndex]?.value;
			n?.classList.remove("is-dragging"), n?.hasPointerCapture(e.pointerId) && n.releasePointerCapture(e.pointerId), this._paneDrag = null, this._paneDragActive = !1, this._normalizePaneRatios(), this._saveLayoutPrefs(), this.requestUpdate();
		}, this._onHomeClick = (e) => {
			e.preventDefault(), this._resetViewer();
		}, this._onLoadDemo = () => {
			this._loadDemo();
		}, this._onOpenFiles = (e) => {
			let t = e.detail.files.filter((e) => this._collection.isArchiveFile(e) || this._collection.isMarkupFile(e));
			t.length && this._addFilesToCatalog(t, { replace: !0 });
		}, this._onTogglePane = (e) => {
			let { pane: t, checked: n } = e.detail;
			if (!this._docState) {
				this._syncToolbarPaneCheckboxes();
				return;
			}
			if (![...Q].filter((e) => e === t ? n : this.panes.includes(e) && this._isPaneAvailable(e)).length) {
				this._syncToolbarPaneCheckboxes();
				return;
			}
			this._setUserPaneVisible(t, n);
		}, this._onResetPaneLayout = () => {
			this._docState && this._resetPaneLayout();
		}, this._onCollectionSelect = (e) => {
			let { index: t } = e.detail;
			this._collection.persistActiveViewState(this.page, this._pageViewPaneRef.value?.zoomPercent ?? 100), this._collection.selectEntry(t).then((e) => {
				if (!e) {
					this._resetViewer();
					return;
				}
				let t = this._collection.activeEntry;
				this._activateDocument(e, t.currentPage ?? 1);
			});
		}, this._onCollectionClose = (e) => {
			let { index: t } = e.detail;
			this._collection.persistActiveViewState(this.page, this._pageViewPaneRef.value?.zoomPercent ?? 100), this._collection.closeEntry(t).then(({ doc: e, newIndex: t }) => {
				if (t < 0) {
					this._resetViewer();
					return;
				}
				if (e) {
					let t = this._collection.activeEntry;
					this._activateDocument(e, t.currentPage ?? 1);
				} else this._syncCollectionPaneDefault(), this._syncToolbarPaneCheckboxes(), this._applyPaneLayout(), this.requestUpdate();
			});
		}, this._onCollectionCloseAll = () => {
			let e = this._collection.size;
			if (!e) return;
			let t = this._collection.entries[0]?.label ?? "", n = e === 1 ? `Remove "${t}" from the viewer?` : `Remove all ${e} open files from the viewer?`;
			confirm(n) && this._resetViewer();
		}, this._onElementSelect = (e) => {
			let t = e.detail.id, n = this._resolveSelectionElementId(t) ?? t;
			this._selectElement(n);
		}, this._onNavigateThread = (e) => {
			let { elementId: t, direction: n } = e.detail;
			this._navigateThreadFragment(t, n);
		}, this._onClearSelection = () => {
			this._clearSelection();
		}, this._onViewPage = (e) => {
			this.page = e.detail.page;
		};
	}
	static {
		this.styles = s(Ji);
	}
	connectedCallback() {
		super.connectedCallback(), this._loadLayoutPrefs(), this._normalizePaneRatios(), this._initDragDrop(), this._initFileHandling(), this._initPaneDragListeners(), this.addEventListener("view-page", this._onViewPage), this.example && (this._demoLoading = !0, setTimeout(() => {
			this._suppressDemoLoad || this._loadDemo();
		}, 0));
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.removeEventListener("pointermove", this._onWindowPointerMove), window.removeEventListener("pointerup", this._onWindowPointerUp), window.removeEventListener("pointercancel", this._onWindowPointerUp), this.removeEventListener("view-page", this._onViewPage);
	}
	updated(e) {
		super.updated(e), this.classList.toggle("loaded", this._loaded), this.classList.toggle("markup-only", this._markupOnly), this.classList.toggle("drag-over", this._dragOver), this.classList.toggle("pane-drag-active", this._paneDragActive);
	}
	firstUpdated() {
		let e = this._emptyStateRef.value;
		e && e.setFileTypeHints(Xi), this._demoLoading && e && e.setDemoLoading(!0), this._syncToolbarPaneCheckboxes();
	}
	render() {
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
            ${j(this._pageNavRef)}
            ?hidden=${!this._loaded || this._markupOnly}
            .document=${this._docState}
            .page=${this.page}
          ></doclang-page-nav>
        </div>

        <div class="header-center">
          ${this._docLabel ? b`<span class="doc-label">${this._docLabel}</span>` : C}
        </div>

        <div class="toolbar-wrap">
          <doclang-toolbar
            ${j(this._toolbarRef)}
            @doclang-load-demo=${this._onLoadDemo}
            @doclang-open-files=${this._onOpenFiles}
            @doclang-toggle-pane=${this._onTogglePane}
            @doclang-reset-pane-layout=${this._onResetPaneLayout}
          ></doclang-toolbar>
        </div>
      </header>

      <p class="drop-banner">Drop to open another file</p>

      <doclang-empty
        ${j(this._emptyStateRef)}
        @doclang-load-demo=${this._onLoadDemo}
      ></doclang-empty>

      <div
        class="main"
        style=${qi(this._mainGridStyle)}
        ${j(this._mainRef)}
      >
        <doclang-collection-pane
          ${j(this._collectionPaneRef)}
          class="pane"
          ?hidden=${!this._isPaneVisible("file")}
          style=${this._paneGridStyle("file")}
          .entries=${this._collection.entries}
          @doclang-collection-select=${(e) => this._onCollectionSelect(e)}
          @doclang-collection-close=${(e) => this._onCollectionClose(e)}
          @doclang-collection-close-all=${this._onCollectionCloseAll}
        ></doclang-collection-pane>

        <div
          class=${W({ "pane-splitter": !0 })}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Files and Original page panes"
          tabindex="0"
          ?hidden=${this._splitterCols[0] === null}
          style=${this._splitterGridStyle(0)}
          ${j(this._splitterRefs[0])}
          @pointerdown=${(e) => this._startPaneDrag(e, 0)}
        ></div>

        <doclang-pane-stack
          .document=${this._docState}
          .page=${this.page}
          .selected=${this.selected}
          @view-page=${this._onViewPage}
          @doclang-element-select=${this._onElementSelect}
          @doclang-navigate-thread=${this._onNavigateThread}
          @doclang-clear-selection=${this._onClearSelection}
          style="display:contents"
        >
          <doclang-page-img-pane
            ${j(this._pageViewPaneRef)}
            class="pane"
            ?hidden=${!this._isPaneVisible("page")}
            style=${this._paneGridStyle("page")}
          ></doclang-page-img-pane>

          <div
            class="pane-splitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize Original page and DocLang panes"
            tabindex="0"
            ?hidden=${this._splitterCols[1] === null}
            style=${this._splitterGridStyle(1)}
            ${j(this._splitterRefs[1])}
            @pointerdown=${(e) => this._startPaneDrag(e, 1)}
          ></div>

          <doclang-markup-pane
            ${j(this._markupPaneRef)}
            class="pane"
            ?hidden=${!this._isPaneVisible("markup")}
            style=${this._paneGridStyle("markup")}
          ></doclang-markup-pane>

          <div
            class="pane-splitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize DocLang and Reading view panes"
            tabindex="0"
            ?hidden=${this._splitterCols[2] === null}
            style=${this._splitterGridStyle(2)}
            ${j(this._splitterRefs[2])}
            @pointerdown=${(e) => this._startPaneDrag(e, 2)}
          ></div>

          <doclang-reading-pane
            ${j(this._readingPaneRef)}
            class="pane"
            ?hidden=${!this._isPaneVisible("reading")}
            style=${this._paneGridStyle("reading")}
          ></doclang-reading-pane>
        </doclang-pane-stack>
      </div>

    `;
	}
	_renderDocument() {}
	_clearDocument() {}
	_paneGridStyle(e) {
		let t = this._paneGridCols.get(e);
		return t === void 0 ? "" : `grid-column:${t}`;
	}
	_splitterGridStyle(e) {
		let t = this._splitterCols[e];
		return t === null ? "" : `grid-column:${t}`;
	}
	_isPaneAvailable(e) {
		return e === "file" ? this._collection.size > 0 : e === "page" ? !!this._docState?.hasPageView : !!this._docState;
	}
	_isPaneVisible(e) {
		return this._isPaneAvailable(e) ? this.panes.includes(e) : !1;
	}
	_visiblePaneKeys() {
		return [...Q].filter((e) => this._isPaneVisible(e));
	}
	_filePaneFitWidthPx() {
		let e = document.createElement("div");
		e.style.cssText = "position:absolute;visibility:hidden;width:var(--doclang-file-pane-fit-width);", (this.shadowRoot ?? document.documentElement).appendChild(e);
		let t = e.getBoundingClientRect().width;
		return e.remove(), Math.ceil(t) || 108;
	}
	_resolvedFilePaneWidthPx() {
		let e = this._filePaneFitWidthPx();
		return Math.max(e, this._filePaneWidthPx ?? e);
	}
	_contentPaneFrWeights(e) {
		let t = e.filter((e) => e !== "file"), n = t.map((e) => this._paneRatios[this._paneRatioIndex(e)]), r = n.reduce((e, t) => e + t, 0) || t.length;
		return n.map((e) => e / r);
	}
	_paneRatioIndex(e) {
		return Q.indexOf(e);
	}
	_normalizePaneRatios() {
		let e = this._paneRatios.reduce((e, t) => e + t, 0);
		if (e <= 0) {
			this._paneRatios = [...$i];
			return;
		}
		this._paneRatios = this._paneRatios.map((t) => t / e);
	}
	_paneKeysAdjacent(e, t) {
		return Q.indexOf(e) >= 0 && Q.indexOf(t) === Q.indexOf(e) + 1;
	}
	_onlyHiddenPanesBetween(e, t) {
		let n = Q.indexOf(e), r = Q.indexOf(t);
		if (n < 0 || r <= n) return !1;
		for (let e = n + 1; e < r; e++) if (this._isPaneVisible(Q[e])) return !1;
		return !0;
	}
	_shouldShowSplitter(e, t) {
		return !this._isPaneVisible(e) || !this._isPaneVisible(t) ? !1 : this._paneKeysAdjacent(e, t) ? !0 : this._onlyHiddenPanesBetween(e, t);
	}
	_visibleNeighborAfter(e) {
		let t = Q.indexOf(e);
		for (let e = t + 1; e < Q.length; e++) if (this._isPaneVisible(Q[e])) return Q[e];
		return null;
	}
	_visibleNeighborBefore(e) {
		let t = Q.indexOf(e);
		for (let e = t - 1; e >= 0; e--) if (this._isPaneVisible(Q[e])) return Q[e];
		return null;
	}
	_applyPaneLayout() {
		let e = this._visiblePaneKeys();
		e.length || (this.panes.includes("markup") || (this.panes = [...this.panes, "markup"]), e = this._visiblePaneKeys());
		let t = /* @__PURE__ */ new Map(), n = [
			null,
			null,
			null
		];
		if (!this._loaded) {
			this._paneGridCols = t, this._splitterCols = n, this._mainGridStyle = {}, this.requestUpdate();
			return;
		}
		let r = this._contentPaneFrWeights(e), i = [], a = 0;
		e.forEach((t, n) => {
			t === "file" ? i.push(`${this._resolvedFilePaneWidthPx()}px`) : i.push(`minmax(0, ${r[a++].toFixed(6)}fr)`), n < e.length - 1 && this._shouldShowSplitter(e[n], e[n + 1]) && i.push("1px");
		});
		let o = 1;
		e.forEach((r, i) => {
			if (t.set(r, o++), i < e.length - 1) {
				let t = e[i], r = e[i + 1];
				if (!this._shouldShowSplitter(t, r)) return;
				let a = Q.indexOf(t);
				a >= 0 && a < 3 && (n[a] = o++);
			}
		}), this._paneGridCols = t, this._splitterCols = n, this._mainGridStyle = { gridTemplateColumns: i.join(" ") }, this._pageViewPaneRef.value?.refreshLayout(), this._readingPaneRef.value?.setVisible(this._isPaneVisible("reading")), this.requestUpdate();
	}
	_setUserPaneVisible(e, t) {
		this.panes = t ? [...this.panes.filter((t) => t !== e), e] : this.panes.filter((t) => t !== e), e === "file" && (this._filePaneUserToggled = !0), e === "page" && this._syncPagePaneControls(), this._syncToolbarPaneCheckboxes(), this._saveLayoutPrefs(), this._applyPaneLayout();
	}
	_syncPagePaneControls() {
		this._pageViewPaneRef.value?.setVisible(this._isPaneVisible("page"));
	}
	_loadLayoutPrefs() {
		try {
			let e = localStorage.getItem(Zi);
			if (!e) return;
			let t = JSON.parse(e);
			if (t?.visible && typeof t.visible == "object") {
				let e = [];
				for (let n of Q) t.visible[n] === !0 && e.push(n);
				e.length && (this.panes = e), typeof t.visible.file == "boolean" && (this._filePaneUserToggled = !0);
			}
			if (Array.isArray(t?.ratios)) {
				let e = t.ratios.every((e) => typeof e == "number" && e > 0);
				e && t.ratios.length === 4 ? (this._paneRatios = [...t.ratios], this._normalizePaneRatios()) : e && t.ratios.length === 3 && (this._paneRatios = [1, ...t.ratios], this._normalizePaneRatios());
			}
			typeof t?.filePaneWidthPx == "number" && t.filePaneWidthPx > 0 && (this._filePaneWidthPx = t.filePaneWidthPx);
		} catch {}
	}
	_saveLayoutPrefs() {
		try {
			localStorage.setItem(Zi, JSON.stringify({
				visible: Object.fromEntries(Q.map((e) => [e, this.panes.includes(e)])),
				ratios: this._paneRatios,
				filePaneWidthPx: this._filePaneWidthPx
			}));
		} catch {}
	}
	_resetPaneLayout() {
		this._filePaneUserToggled = !1, this.panes = this._collection.hasMultiple() ? [
			"file",
			"page",
			"markup",
			"reading"
		] : [
			"page",
			"markup",
			"reading"
		], this._paneRatios = [...$i], this._normalizePaneRatios(), this._filePaneWidthPx = null, this._syncPagePaneControls(), this._syncToolbarPaneCheckboxes(), this._saveLayoutPrefs(), this._applyPaneLayout();
	}
	_contentPaneAvailableWidthPx() {
		let e = this._mainRef.value;
		if (!e) return 1;
		let t = e.getBoundingClientRect(), n = this._visiblePaneKeys(), r = 0;
		n.includes("file") && (r += this._resolvedFilePaneWidthPx());
		for (let e = 0; e < n.length - 1; e++) this._shouldShowSplitter(n[e], n[e + 1]) && (r += 1);
		return Math.max(t.width - r, 1);
	}
	_resolvedPhysicalSplitterKeys(e) {
		let t = Q[e], n = Q[e + 1];
		if (!t || !n) return null;
		let r = this._isPaneVisible(t) ? t : this._visibleNeighborBefore(n), i = this._isPaneVisible(n) ? n : this._visibleNeighborAfter(t);
		return !r || !i || r === i || !this._shouldShowSplitter(r, i) || Q.indexOf(r) !== e ? null : {
			leftKey: r,
			rightKey: i
		};
	}
	_startPaneDrag(e, t) {
		if (e.button !== 0 || !this._loaded) return;
		let n = this._resolvedPhysicalSplitterKeys(t);
		if (!n) return;
		let { leftKey: r, rightKey: i } = n;
		this._normalizePaneRatios();
		let a = this._paneRatioIndex(r), o = this._paneRatioIndex(i), s = {
			physicalSplitterIndex: t,
			leftKey: r,
			rightKey: i,
			startX: e.clientX,
			leftStart: this._paneRatios[a],
			rightStart: this._paneRatios[o],
			pointerId: e.pointerId
		};
		r === "file" ? s.leftStartPx = this._resolvedFilePaneWidthPx() : i === "file" && (s.rightStartPx = this._resolvedFilePaneWidthPx()), this._paneDrag = s, e.preventDefault(), e.currentTarget.setPointerCapture(e.pointerId), e.currentTarget.classList.add("is-dragging"), this._paneDragActive = !0, this.requestUpdate();
	}
	_findElementIdOnPage(e) {
		if (!this._docState?.elementIds) return null;
		for (let [t, n] of this._docState.elementIds) if (t === e) return n;
		return null;
	}
	_navigateThreadFragment(e, t) {
		let n = this._docState, r = n?.idToElement?.get(e);
		if (!r) return;
		let i = n?.threadNavByElement?.get(r);
		if (!i) return;
		let a = t === "prev" ? i.prev : i.next;
		if (!a) return;
		let o = n.elementPageByEl.get(a);
		if (o) {
			if (o === this.page) {
				let e = this._findElementIdOnPage(a);
				e && this._selectElement(e);
				return;
			}
			n.pendingSelectElement = a, this.page = o;
		}
	}
	_findListVirtualTextHost(e, t) {
		let n = [...e.childNodes], r = xt(n, 0);
		for (; r < n.length;) {
			let e = n[r];
			if (e.nodeType !== Node.ELEMENT_NODE || L(e) !== "ldiv") {
				r++;
				continue;
			}
			let i = e;
			r++;
			let a = St(n, r);
			if (t === i || n.slice(r, a).some((e) => Et(t, e))) return i;
			r = a;
		}
		return null;
	}
	_findTableVirtualTextHost(e, t) {
		let n = [...e.childNodes], r = xt(n, 0);
		for (; r < n.length;) {
			let e = n[r];
			if (e.nodeType !== Node.ELEMENT_NODE) {
				r++;
				continue;
			}
			let i = L(e);
			if (i === "nl" || It(e) || _t.has(i) || !B(i)) {
				r++;
				continue;
			}
			let a = e;
			r++;
			let o = Ct(n, r);
			if (t === a || n.slice(r, o).some((e) => Et(t, e))) return a;
			r = o;
		}
		return null;
	}
	_findVirtualTextHost(e) {
		let t = e;
		for (; t;) {
			let n = t.parentElement;
			if (!n) return null;
			let r = L(n);
			if (r === "list") {
				let t = this._findListVirtualTextHost(n, e);
				if (t) return t;
			}
			if (N.has(r)) {
				let t = this._findTableVirtualTextHost(n, e);
				if (t) return t;
			}
			t = n;
		}
		return null;
	}
	_resolveSelectionElement(e) {
		if (!e) return null;
		if (Ft(e) || It(e)) return e;
		let t = e.parentElement;
		for (; t && L(t) !== "doclang";) {
			if (Ft(t) && !bt(t)) return t;
			t = t.parentElement;
		}
		let n = this._findVirtualTextHost(e);
		if (n) return n;
		for (t = e.parentElement; t && L(t) !== "doclang";) {
			if (Ft(t) || It(t)) return t;
			t = t.parentElement;
		}
		return null;
	}
	_resolveSelectionElementId(e) {
		let t = this._docState;
		if (!e || !t?.idToElement || !t.elementIds) return null;
		let n = t.idToElement.get(e);
		if (!n) return null;
		let r = this._resolveSelectionElement(n);
		return r ? t.elementIds.get(r) ?? null : null;
	}
	_selectElement(e) {
		e && (this.selected = e);
	}
	_clearSelection() {
		this.selected = null;
	}
	_syncToolbarPaneCheckboxes() {
		this._toolbarRef.value?.syncPaneToggles({
			file: this.panes.includes("file"),
			page: this.panes.includes("page"),
			markup: this.panes.includes("markup"),
			reading: this.panes.includes("reading"),
			fileAvailable: this._isPaneAvailable("file"),
			pageAvailable: this._isPaneAvailable("page"),
			hasState: !!this._docState
		});
	}
	_setDocumentOpen(e, { markupOnly: t = !1 } = {}) {
		this._loaded = e, this._markupOnly = e && t, this._syncToolbarPaneCheckboxes(), this._applyPaneLayout(), this.requestUpdate();
	}
	_setPageViewVisible() {
		this._syncPagePaneControls(), this._syncToolbarPaneCheckboxes(), this._applyPaneLayout();
	}
	_resetViewer() {
		this._setDemoLoading(!1), this._collection.clearAll(), this._filePaneUserToggled = !1, this._pageViewPaneRef.value?.resetZoom(), this._docLabel = null, this._setDocumentOpen(!1), this.document = null, this.selected = null, this._syncCollectionPaneDefault(), this._syncToolbarPaneCheckboxes(), this._applyPaneLayout(), this.requestUpdate();
	}
	_activateDocument(e, t = 1) {
		let n = this._collection.activeEntry;
		n && (this._pageViewPaneRef.value?.activateZoom(n.pageZoom ?? 100), this._docLabel = n.label, this.selected = null, this.document = e, this._setDocumentOpen(!0, { markupOnly: e.markupOnly }), this._setPageViewVisible(), this.page = t, this._syncCollectionPaneDefault(), this._syncToolbarPaneCheckboxes(), this._applyPaneLayout(), this.requestUpdate());
	}
	_syncCollectionPaneDefault() {
		if (!this._filePaneUserToggled) {
			let e = this.panes.includes("file"), t = this._collection.hasMultiple();
			this.panes = t ? [...this.panes.filter((e) => e !== "file"), "file"] : this.panes.filter((e) => e !== "file"), !e && t && (this._paneRatios = [...$i], this._normalizePaneRatios(), this._filePaneWidthPx = null);
		}
	}
	async _addFilesToCatalog(e, { replace: t = !1 } = {}) {
		t && (this._filePaneUserToggled = !1);
		let n = await this._collection.addFiles(e, { replace: t });
		if (!n) return;
		let r = this._collection.activeEntry;
		this._activateDocument(n, r.currentPage ?? 1);
	}
	async _appendFolderArchive(e) {
		let t = await this._collection.appendFolderArchive(e);
		if (!t) return;
		let n = this._collection.activeEntry;
		this._activateDocument(t, n.currentPage ?? 1);
	}
	async _addArchiveBufferToCatalog(e, t, { replace: n = !1 } = {}) {
		n && (this._filePaneUserToggled = !1);
		let r = await this._collection.addArchiveBuffer(e, t, { replace: n });
		if (!r) return;
		let i = this._collection.activeEntry;
		this._activateDocument(r, i.currentPage ?? 1);
	}
	_setDemoLoading(e) {
		this._demoLoading = e, this._emptyStateRef.value?.setDemoLoading(e), this._toolbarRef.value?.setDemoLoading(e), this.requestUpdate();
	}
	async _loadDemo() {
		if (!this._demoLoadInProgress) {
			this._demoLoadInProgress = !0, this._setDemoLoading(!0);
			try {
				let e = this.example;
				if (!e) throw Error("example URL not defined");
				let t = await fetch(e);
				if (!t.ok) throw Error(`HTTP ${t.status}`);
				let n = e.split("/").pop() || "demo.dclx";
				await this._addArchiveBufferToCatalog(await t.arrayBuffer(), n, { replace: !0 });
			} catch (e) {
				alert(`Failed to load demo: ${e.message}\n\nServe this directory over HTTP (e.g. python3 -m http.server) and open the viewer from localhost.`);
			} finally {
				this._demoLoadInProgress = !1, this._setDemoLoading(!1);
			}
		}
	}
	_hasArchiveTransfer(e) {
		return !!(e && [...e.types].includes("Files"));
	}
	_initDragDrop() {
		this.addEventListener("dragenter", (e) => {
			this._hasArchiveTransfer(e.dataTransfer) && (e.preventDefault(), this._dragOver = !0, this.requestUpdate());
		}), this.addEventListener("dragover", (e) => {
			this._hasArchiveTransfer(e.dataTransfer) && (e.preventDefault(), e.dataTransfer && (e.dataTransfer.dropEffect = "copy"));
		}), this.addEventListener("dragleave", (e) => {
			this._hasArchiveTransfer(e.dataTransfer) && (e.relatedTarget && this.contains(e.relatedTarget) || (this._dragOver = !1, this.requestUpdate()));
		}), this.addEventListener("drop", async (e) => {
			this._hasArchiveTransfer(e.dataTransfer) && (e.preventDefault(), this._dragOver = !1, this.requestUpdate(), e.dataTransfer && await this._loadFromDrop(e.dataTransfer));
		});
	}
	async _loadFromFileList(e) {
		if (e.some((e) => e.name === "document.xml")) {
			await this._appendFolderArchive(e);
			return;
		}
		let t = e.filter((e) => this._collection.isArchiveFile(e) || this._collection.isMarkupFile(e));
		t.length && await this._addFilesToCatalog(t, { replace: !1 });
	}
	async _loadFromDrop(e) {
		await this._loadFromFileList([...e.files]);
	}
	_initFileHandling() {
		let e = window;
		!("launchQueue" in window) || !e.launchQueue || e.launchQueue.setConsumer(async (e) => {
			if (!e.files?.length) return;
			this._suppressDemoLoad = !0;
			let t = await Promise.all(e.files.map((e) => e.getFile()));
			await this._loadFromFileList(t);
		});
	}
	_initPaneDragListeners() {
		window.addEventListener("pointermove", this._onWindowPointerMove), window.addEventListener("pointerup", this._onWindowPointerUp), window.addEventListener("pointercancel", this._onWindowPointerUp);
	}
};
H([D({ type: String })], $.prototype, "example", void 0), H([O()], $.prototype, "_loaded", void 0), H([O()], $.prototype, "_markupOnly", void 0), H([O()], $.prototype, "_dragOver", void 0), H([O()], $.prototype, "_paneDragActive", void 0), H([O()], $.prototype, "_demoLoading", void 0), H([O()], $.prototype, "_docLabel", void 0), H([O()], $.prototype, "_mainGridStyle", void 0), H([O()], $.prototype, "_paneGridCols", void 0), H([O()], $.prototype, "_splitterCols", void 0), H([D({
	type: Array,
	attribute: "panes",
	reflect: !0
})], $.prototype, "panes", void 0), $ = H([E("doclang-viewer")], $);
//#endregion
export { Yi as CollectionController, Yn as DoclangCollectionPane, Un as DoclangDropdown, Ui as DoclangEmpty, lr as DoclangMarkupPane, U as DoclangPageElement, Yr as DoclangPageImgPane, Bn as DoclangPageNav, Wi as DoclangPaneStack, Z as DoclangReadingPane, fr as DoclangSettingsPanel, Wn as DoclangToolbar, $ as DoclangViewer, $n as PageController };

//# sourceMappingURL=viewer.js.map
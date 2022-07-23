
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const parseNumber = parseFloat;

    function joinCss(obj, separator = ';') {
      let texts;
      if (Array.isArray(obj)) {
        texts = obj.filter((text) => text);
      } else {
        texts = [];
        for (const prop in obj) {
          if (obj[prop]) {
            texts.push(`${prop}:${obj[prop]}`);
          }
        }
      }
      return texts.join(separator);
    }

    function getStyles(style, size, pull, fw) {
      let float;
      let width;
      const height = '1em';
      let lineHeight;
      let fontSize;
      let textAlign;
      let verticalAlign = '-.125em';
      const overflow = 'visible';

      if (fw) {
        textAlign = 'center';
        width = '1.25em';
      }

      if (pull) {
        float = pull;
      }

      if (size) {
        if (size == 'lg') {
          fontSize = '1.33333em';
          lineHeight = '.75em';
          verticalAlign = '-.225em';
        } else if (size == 'xs') {
          fontSize = '.75em';
        } else if (size == 'sm') {
          fontSize = '.875em';
        } else {
          fontSize = size.replace('x', 'em');
        }
      }

      return joinCss([
        joinCss({
          float,
          width,
          height,
          'line-height': lineHeight,
          'font-size': fontSize,
          'text-align': textAlign,
          'vertical-align': verticalAlign,
          'transform-origin': 'center',
          overflow,
        }),
        style,
      ]);
    }

    function getTransform(
      scale,
      translateX,
      translateY,
      rotate,
      flip,
      translateTimes = 1,
      translateUnit = '',
      rotateUnit = '',
    ) {
      let flipX = 1;
      let flipY = 1;

      if (flip) {
        if (flip == 'horizontal') {
          flipX = -1;
        } else if (flip == 'vertical') {
          flipY = -1;
        } else {
          flipX = flipY = -1;
        }
      }

      return joinCss(
        [
          `translate(${parseNumber(translateX) * translateTimes}${translateUnit},${parseNumber(translateY) * translateTimes}${translateUnit})`,
          `scale(${flipX * parseNumber(scale)},${flipY * parseNumber(scale)})`,
          rotate && `rotate(${rotate}${rotateUnit})`,
        ],
        ' ',
      );
    }

    /* node_modules\svelte-fa\src\fa.svelte generated by Svelte v3.49.0 */
    const file$8 = "node_modules\\svelte-fa\\src\\fa.svelte";

    // (66:0) {#if i[4]}
    function create_if_block(ctx) {
    	let svg;
    	let g1;
    	let g0;
    	let g1_transform_value;
    	let g1_transform_origin_value;
    	let svg_id_value;
    	let svg_class_value;
    	let svg_viewBox_value;

    	function select_block_type(ctx, dirty) {
    		if (typeof /*i*/ ctx[10][4] == 'string') return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			if_block.c();
    			attr_dev(g0, "transform", /*transform*/ ctx[12]);
    			add_location(g0, file$8, 81, 6, 1397);
    			attr_dev(g1, "transform", g1_transform_value = "translate(" + /*i*/ ctx[10][0] / 2 + " " + /*i*/ ctx[10][1] / 2 + ")");
    			attr_dev(g1, "transform-origin", g1_transform_origin_value = "" + (/*i*/ ctx[10][0] / 4 + " 0"));
    			add_location(g1, file$8, 77, 4, 1293);
    			attr_dev(svg, "id", svg_id_value = /*id*/ ctx[1] || undefined);
    			attr_dev(svg, "class", svg_class_value = "svelte-fa " + /*clazz*/ ctx[0] + " svelte-1cj2gr0");
    			attr_dev(svg, "style", /*s*/ ctx[11]);
    			attr_dev(svg, "viewBox", svg_viewBox_value = "0 0 " + /*i*/ ctx[10][0] + " " + /*i*/ ctx[10][1]);
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			toggle_class(svg, "pulse", /*pulse*/ ctx[4]);
    			toggle_class(svg, "spin", /*spin*/ ctx[3]);
    			add_location(svg, file$8, 66, 2, 1071);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g1);
    			append_dev(g1, g0);
    			if_block.m(g0, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(g0, null);
    				}
    			}

    			if (dirty & /*transform*/ 4096) {
    				attr_dev(g0, "transform", /*transform*/ ctx[12]);
    			}

    			if (dirty & /*i*/ 1024 && g1_transform_value !== (g1_transform_value = "translate(" + /*i*/ ctx[10][0] / 2 + " " + /*i*/ ctx[10][1] / 2 + ")")) {
    				attr_dev(g1, "transform", g1_transform_value);
    			}

    			if (dirty & /*i*/ 1024 && g1_transform_origin_value !== (g1_transform_origin_value = "" + (/*i*/ ctx[10][0] / 4 + " 0"))) {
    				attr_dev(g1, "transform-origin", g1_transform_origin_value);
    			}

    			if (dirty & /*id*/ 2 && svg_id_value !== (svg_id_value = /*id*/ ctx[1] || undefined)) {
    				attr_dev(svg, "id", svg_id_value);
    			}

    			if (dirty & /*clazz*/ 1 && svg_class_value !== (svg_class_value = "svelte-fa " + /*clazz*/ ctx[0] + " svelte-1cj2gr0")) {
    				attr_dev(svg, "class", svg_class_value);
    			}

    			if (dirty & /*s*/ 2048) {
    				attr_dev(svg, "style", /*s*/ ctx[11]);
    			}

    			if (dirty & /*i*/ 1024 && svg_viewBox_value !== (svg_viewBox_value = "0 0 " + /*i*/ ctx[10][0] + " " + /*i*/ ctx[10][1])) {
    				attr_dev(svg, "viewBox", svg_viewBox_value);
    			}

    			if (dirty & /*clazz, pulse*/ 17) {
    				toggle_class(svg, "pulse", /*pulse*/ ctx[4]);
    			}

    			if (dirty & /*clazz, spin*/ 9) {
    				toggle_class(svg, "spin", /*spin*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(66:0) {#if i[4]}",
    		ctx
    	});

    	return block;
    }

    // (89:8) {:else}
    function create_else_block(ctx) {
    	let path0;
    	let path0_d_value;
    	let path0_fill_value;
    	let path0_fill_opacity_value;
    	let path0_transform_value;
    	let path1;
    	let path1_d_value;
    	let path1_fill_value;
    	let path1_fill_opacity_value;
    	let path1_transform_value;

    	const block = {
    		c: function create() {
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", path0_d_value = /*i*/ ctx[10][4][0]);
    			attr_dev(path0, "fill", path0_fill_value = /*secondaryColor*/ ctx[6] || /*color*/ ctx[2] || 'currentColor');

    			attr_dev(path0, "fill-opacity", path0_fill_opacity_value = /*swapOpacity*/ ctx[9] != false
    			? /*primaryOpacity*/ ctx[7]
    			: /*secondaryOpacity*/ ctx[8]);

    			attr_dev(path0, "transform", path0_transform_value = "translate(" + /*i*/ ctx[10][0] / -2 + " " + /*i*/ ctx[10][1] / -2 + ")");
    			add_location(path0, file$8, 90, 10, 1678);
    			attr_dev(path1, "d", path1_d_value = /*i*/ ctx[10][4][1]);
    			attr_dev(path1, "fill", path1_fill_value = /*primaryColor*/ ctx[5] || /*color*/ ctx[2] || 'currentColor');

    			attr_dev(path1, "fill-opacity", path1_fill_opacity_value = /*swapOpacity*/ ctx[9] != false
    			? /*secondaryOpacity*/ ctx[8]
    			: /*primaryOpacity*/ ctx[7]);

    			attr_dev(path1, "transform", path1_transform_value = "translate(" + /*i*/ ctx[10][0] / -2 + " " + /*i*/ ctx[10][1] / -2 + ")");
    			add_location(path1, file$8, 96, 10, 1935);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path0, anchor);
    			insert_dev(target, path1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*i*/ 1024 && path0_d_value !== (path0_d_value = /*i*/ ctx[10][4][0])) {
    				attr_dev(path0, "d", path0_d_value);
    			}

    			if (dirty & /*secondaryColor, color*/ 68 && path0_fill_value !== (path0_fill_value = /*secondaryColor*/ ctx[6] || /*color*/ ctx[2] || 'currentColor')) {
    				attr_dev(path0, "fill", path0_fill_value);
    			}

    			if (dirty & /*swapOpacity, primaryOpacity, secondaryOpacity*/ 896 && path0_fill_opacity_value !== (path0_fill_opacity_value = /*swapOpacity*/ ctx[9] != false
    			? /*primaryOpacity*/ ctx[7]
    			: /*secondaryOpacity*/ ctx[8])) {
    				attr_dev(path0, "fill-opacity", path0_fill_opacity_value);
    			}

    			if (dirty & /*i*/ 1024 && path0_transform_value !== (path0_transform_value = "translate(" + /*i*/ ctx[10][0] / -2 + " " + /*i*/ ctx[10][1] / -2 + ")")) {
    				attr_dev(path0, "transform", path0_transform_value);
    			}

    			if (dirty & /*i*/ 1024 && path1_d_value !== (path1_d_value = /*i*/ ctx[10][4][1])) {
    				attr_dev(path1, "d", path1_d_value);
    			}

    			if (dirty & /*primaryColor, color*/ 36 && path1_fill_value !== (path1_fill_value = /*primaryColor*/ ctx[5] || /*color*/ ctx[2] || 'currentColor')) {
    				attr_dev(path1, "fill", path1_fill_value);
    			}

    			if (dirty & /*swapOpacity, secondaryOpacity, primaryOpacity*/ 896 && path1_fill_opacity_value !== (path1_fill_opacity_value = /*swapOpacity*/ ctx[9] != false
    			? /*secondaryOpacity*/ ctx[8]
    			: /*primaryOpacity*/ ctx[7])) {
    				attr_dev(path1, "fill-opacity", path1_fill_opacity_value);
    			}

    			if (dirty & /*i*/ 1024 && path1_transform_value !== (path1_transform_value = "translate(" + /*i*/ ctx[10][0] / -2 + " " + /*i*/ ctx[10][1] / -2 + ")")) {
    				attr_dev(path1, "transform", path1_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path0);
    			if (detaching) detach_dev(path1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(89:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (83:8) {#if typeof i[4] == 'string'}
    function create_if_block_1(ctx) {
    	let path;
    	let path_d_value;
    	let path_fill_value;
    	let path_transform_value;

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			attr_dev(path, "d", path_d_value = /*i*/ ctx[10][4]);
    			attr_dev(path, "fill", path_fill_value = /*color*/ ctx[2] || /*primaryColor*/ ctx[5] || 'currentColor');
    			attr_dev(path, "transform", path_transform_value = "translate(" + /*i*/ ctx[10][0] / -2 + " " + /*i*/ ctx[10][1] / -2 + ")");
    			add_location(path, file$8, 83, 10, 1461);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*i*/ 1024 && path_d_value !== (path_d_value = /*i*/ ctx[10][4])) {
    				attr_dev(path, "d", path_d_value);
    			}

    			if (dirty & /*color, primaryColor*/ 36 && path_fill_value !== (path_fill_value = /*color*/ ctx[2] || /*primaryColor*/ ctx[5] || 'currentColor')) {
    				attr_dev(path, "fill", path_fill_value);
    			}

    			if (dirty & /*i*/ 1024 && path_transform_value !== (path_transform_value = "translate(" + /*i*/ ctx[10][0] / -2 + " " + /*i*/ ctx[10][1] / -2 + ")")) {
    				attr_dev(path, "transform", path_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(83:8) {#if typeof i[4] == 'string'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*i*/ ctx[10][4] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*i*/ ctx[10][4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Fa', slots, []);
    	let { class: clazz = '' } = $$props;
    	let { id = '' } = $$props;
    	let { style = '' } = $$props;
    	let { icon } = $$props;
    	let { size = '' } = $$props;
    	let { color = '' } = $$props;
    	let { fw = false } = $$props;
    	let { pull = '' } = $$props;
    	let { scale = 1 } = $$props;
    	let { translateX = 0 } = $$props;
    	let { translateY = 0 } = $$props;
    	let { rotate = '' } = $$props;
    	let { flip = false } = $$props;
    	let { spin = false } = $$props;
    	let { pulse = false } = $$props;
    	let { primaryColor = '' } = $$props;
    	let { secondaryColor = '' } = $$props;
    	let { primaryOpacity = 1 } = $$props;
    	let { secondaryOpacity = 0.4 } = $$props;
    	let { swapOpacity = false } = $$props;
    	let i;
    	let s;
    	let transform;

    	const writable_props = [
    		'class',
    		'id',
    		'style',
    		'icon',
    		'size',
    		'color',
    		'fw',
    		'pull',
    		'scale',
    		'translateX',
    		'translateY',
    		'rotate',
    		'flip',
    		'spin',
    		'pulse',
    		'primaryColor',
    		'secondaryColor',
    		'primaryOpacity',
    		'secondaryOpacity',
    		'swapOpacity'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Fa> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('class' in $$props) $$invalidate(0, clazz = $$props.class);
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('style' in $$props) $$invalidate(13, style = $$props.style);
    		if ('icon' in $$props) $$invalidate(14, icon = $$props.icon);
    		if ('size' in $$props) $$invalidate(15, size = $$props.size);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('fw' in $$props) $$invalidate(16, fw = $$props.fw);
    		if ('pull' in $$props) $$invalidate(17, pull = $$props.pull);
    		if ('scale' in $$props) $$invalidate(18, scale = $$props.scale);
    		if ('translateX' in $$props) $$invalidate(19, translateX = $$props.translateX);
    		if ('translateY' in $$props) $$invalidate(20, translateY = $$props.translateY);
    		if ('rotate' in $$props) $$invalidate(21, rotate = $$props.rotate);
    		if ('flip' in $$props) $$invalidate(22, flip = $$props.flip);
    		if ('spin' in $$props) $$invalidate(3, spin = $$props.spin);
    		if ('pulse' in $$props) $$invalidate(4, pulse = $$props.pulse);
    		if ('primaryColor' in $$props) $$invalidate(5, primaryColor = $$props.primaryColor);
    		if ('secondaryColor' in $$props) $$invalidate(6, secondaryColor = $$props.secondaryColor);
    		if ('primaryOpacity' in $$props) $$invalidate(7, primaryOpacity = $$props.primaryOpacity);
    		if ('secondaryOpacity' in $$props) $$invalidate(8, secondaryOpacity = $$props.secondaryOpacity);
    		if ('swapOpacity' in $$props) $$invalidate(9, swapOpacity = $$props.swapOpacity);
    	};

    	$$self.$capture_state = () => ({
    		getStyles,
    		getTransform,
    		clazz,
    		id,
    		style,
    		icon,
    		size,
    		color,
    		fw,
    		pull,
    		scale,
    		translateX,
    		translateY,
    		rotate,
    		flip,
    		spin,
    		pulse,
    		primaryColor,
    		secondaryColor,
    		primaryOpacity,
    		secondaryOpacity,
    		swapOpacity,
    		i,
    		s,
    		transform
    	});

    	$$self.$inject_state = $$props => {
    		if ('clazz' in $$props) $$invalidate(0, clazz = $$props.clazz);
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('style' in $$props) $$invalidate(13, style = $$props.style);
    		if ('icon' in $$props) $$invalidate(14, icon = $$props.icon);
    		if ('size' in $$props) $$invalidate(15, size = $$props.size);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('fw' in $$props) $$invalidate(16, fw = $$props.fw);
    		if ('pull' in $$props) $$invalidate(17, pull = $$props.pull);
    		if ('scale' in $$props) $$invalidate(18, scale = $$props.scale);
    		if ('translateX' in $$props) $$invalidate(19, translateX = $$props.translateX);
    		if ('translateY' in $$props) $$invalidate(20, translateY = $$props.translateY);
    		if ('rotate' in $$props) $$invalidate(21, rotate = $$props.rotate);
    		if ('flip' in $$props) $$invalidate(22, flip = $$props.flip);
    		if ('spin' in $$props) $$invalidate(3, spin = $$props.spin);
    		if ('pulse' in $$props) $$invalidate(4, pulse = $$props.pulse);
    		if ('primaryColor' in $$props) $$invalidate(5, primaryColor = $$props.primaryColor);
    		if ('secondaryColor' in $$props) $$invalidate(6, secondaryColor = $$props.secondaryColor);
    		if ('primaryOpacity' in $$props) $$invalidate(7, primaryOpacity = $$props.primaryOpacity);
    		if ('secondaryOpacity' in $$props) $$invalidate(8, secondaryOpacity = $$props.secondaryOpacity);
    		if ('swapOpacity' in $$props) $$invalidate(9, swapOpacity = $$props.swapOpacity);
    		if ('i' in $$props) $$invalidate(10, i = $$props.i);
    		if ('s' in $$props) $$invalidate(11, s = $$props.s);
    		if ('transform' in $$props) $$invalidate(12, transform = $$props.transform);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*icon*/ 16384) {
    			$$invalidate(10, i = icon && icon.icon || [0, 0, '', [], '']);
    		}

    		if ($$self.$$.dirty & /*style, size, pull, fw*/ 237568) {
    			$$invalidate(11, s = getStyles(style, size, pull, fw));
    		}

    		if ($$self.$$.dirty & /*scale, translateX, translateY, rotate, flip*/ 8126464) {
    			$$invalidate(12, transform = getTransform(scale, translateX, translateY, rotate, flip, 512));
    		}
    	};

    	return [
    		clazz,
    		id,
    		color,
    		spin,
    		pulse,
    		primaryColor,
    		secondaryColor,
    		primaryOpacity,
    		secondaryOpacity,
    		swapOpacity,
    		i,
    		s,
    		transform,
    		style,
    		icon,
    		size,
    		fw,
    		pull,
    		scale,
    		translateX,
    		translateY,
    		rotate,
    		flip
    	];
    }

    class Fa extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			class: 0,
    			id: 1,
    			style: 13,
    			icon: 14,
    			size: 15,
    			color: 2,
    			fw: 16,
    			pull: 17,
    			scale: 18,
    			translateX: 19,
    			translateY: 20,
    			rotate: 21,
    			flip: 22,
    			spin: 3,
    			pulse: 4,
    			primaryColor: 5,
    			secondaryColor: 6,
    			primaryOpacity: 7,
    			secondaryOpacity: 8,
    			swapOpacity: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fa",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[14] === undefined && !('icon' in props)) {
    			console.warn("<Fa> was created without expected prop 'icon'");
    		}
    	}

    	get class() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fw() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fw(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pull() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pull(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scale() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scale(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get translateX() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set translateX(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get translateY() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set translateY(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rotate() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotate(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flip() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flip(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get spin() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set spin(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pulse() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pulse(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primaryColor() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primaryColor(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondaryColor() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondaryColor(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primaryOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primaryOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondaryOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondaryOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get swapOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set swapOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Fa$1 = Fa;

    /*!
     * Font Awesome Free 6.1.1 by @fontawesome - https://fontawesome.com
     * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
     * Copyright 2022 Fonticons, Inc.
     */
    var faCaretDown = {
      prefix: 'fas',
      iconName: 'caret-down',
      icon: [320, 512, [], "f0d7", "M310.6 246.6l-127.1 128C176.4 380.9 168.2 384 160 384s-16.38-3.125-22.63-9.375l-127.1-128C.2244 237.5-2.516 223.7 2.438 211.8S19.07 192 32 192h255.1c12.94 0 24.62 7.781 29.58 19.75S319.8 237.5 310.6 246.6z"]
    };
    var faCaretUp = {
      prefix: 'fas',
      iconName: 'caret-up',
      icon: [320, 512, [], "f0d8", "M9.39 265.4l127.1-128C143.6 131.1 151.8 128 160 128s16.38 3.125 22.63 9.375l127.1 128c9.156 9.156 11.9 22.91 6.943 34.88S300.9 320 287.1 320H32.01c-12.94 0-24.62-7.781-29.58-19.75S.2333 274.5 9.39 265.4z"]
    };

    let src1 = '/build/assets/img/appMobile.png';
      let src2 = '/build/assets/img/appWeb.png';
      let src3 = '/build/assets/img/appDesign.png';
      let src4 = '/build/assets/img/appCourse.png';

    const SERVICES = [
        {
          title: 'Application mobile',
          description:
            ' Lorem ipsum dolor sit, amet consectetur adipisicing elit. Recusandae quam maiores eum laudantium illo, laborum architecto inventore similique dolore? Laboriosam.',
          link: '#',
          image: src1,
        },
        {
          title: 'Application Web',
          description:
            ' Lorem ipsum dolor sit, amet consectetur adipisicing elit. Recusandae quam maiores eum laudantium illo, laborum architecto inventore similique dolore? Laboriosam.',
          link: '#',
          image: src2,
        },
        {
          title: 'Web Design',
          description:
            ' Lorem ipsum dolor sit, amet consectetur adipisicing elit. Recusandae quam maiores eum laudantium illo, laborum architecto inventore similique dolore? Laboriosam.',
          link: '#',
          image: src3,
        },
        {
          title: 'Cours Gratuit',
          description:
            ' Lorem ipsum dolor sit, amet consectetur adipisicing elit. Recusandae quam maiores eum laudantium illo, laborum architecto inventore similique dolore? Laboriosam.',
          link: '#',
          image: src4,
        },
      ];

      
      const navbar = [
        {
          id: 1,

          name: 'Home',
        },
        {
          id: 2,
          name: 'Service',
        },
        {
          id: 3,
          name: 'Goal',
        },
        {
          id: 4,
          name: 'About',
        },
        {
          id: 5,
          name: 'The client',
        },
      ];

       const navbar_logo = [
        {
          id: 1,

          logo: 'fab fa-facebook-f',

          name:"facebook"
        },
        {
          id: 2,

          logo: 'fab fa-twitter',
          name:"Twitter",
        },
        {
          id: 3,

          logo: 'fab fa-instagram',
          name:'instagram',

        },
        {
          id: 4,

          logo: 'fab fa-codepen',
          name:"codepen"
        },
        {
          id: 5,

          logo: 'fab fa-youtube',
          name:"youtube",

        },
      ];

    /* src\components\navbar.svelte generated by Svelte v3.49.0 */
    const file$7 = "src\\components\\navbar.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (20:6) {#each navbar as nav (nav.id) }
    function create_each_block_1(key_1, ctx) {
    	let li;
    	let a;
    	let t_value = /*nav*/ ctx[3].name + "";
    	let t;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", "home");
    			attr_dev(a, "class", "svelte-1ehlss");
    			add_location(a, file$7, 20, 16, 505);
    			add_location(li, file$7, 20, 12, 501);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(20:6) {#each navbar as nav (nav.id) }",
    		ctx
    	});

    	return block;
    }

    // (27:4) {#each navbar_logo as logo (logo.id) }
    function create_each_block$1(key_1, ctx) {
    	let div1;
    	let div0;
    	let i;
    	let t0;
    	let span;
    	let t1_value = /*logo*/ ctx[0].name + "";
    	let t1;
    	let t2;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			i = element("i");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(i, "class", "" + (null_to_empty(/*logo*/ ctx[0].logo) + " svelte-1ehlss"));
    			add_location(i, file$7, 30, 16, 751);
    			attr_dev(div0, "class", "icon svelte-1ehlss");
    			add_location(div0, file$7, 29, 12, 715);
    			attr_dev(span, "class", "svelte-1ehlss");
    			add_location(span, file$7, 32, 12, 810);
    			attr_dev(div1, "class", "button svelte-1ehlss");
    			add_location(div1, file$7, 28, 9, 681);
    			this.first = div1;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, i);
    			append_dev(div1, t0);
    			append_dev(div1, span);
    			append_dev(span, t1);
    			append_dev(div1, t2);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(27:4) {#each navbar_logo as logo (logo.id) }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div4;
    	let div0;
    	let h1;
    	let span0;
    	let span1;
    	let t2;
    	let div1;
    	let ul;
    	let each_blocks_1 = [];
    	let each0_lookup = new Map();
    	let t3;
    	let div2;
    	let each_blocks = [];
    	let each1_lookup = new Map();
    	let t4;
    	let div3;
    	let t5;
    	let span2;
    	let fa;
    	let current;
    	let each_value_1 = navbar;
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*nav*/ ctx[3].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_1[i] = create_each_block_1(key, child_ctx));
    	}

    	let each_value = navbar_logo;
    	validate_each_argument(each_value);
    	const get_key_1 = ctx => /*logo*/ ctx[0].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key_1);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	fa = new Fa$1({
    			props: { icon: faCaretDown },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			span0 = element("span");
    			span0.textContent = "Pris";
    			span1 = element("span");
    			span1.textContent = "ma";
    			t2 = space();
    			div1 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div3 = element("div");
    			t5 = text("En\r\n    ");
    			span2 = element("span");
    			create_component(fa.$$.fragment);
    			attr_dev(span0, "class", "svelte-1ehlss");
    			add_location(span0, file$7, 15, 8, 329);
    			attr_dev(span1, "class", "span2 svelte-1ehlss");
    			add_location(span1, file$7, 15, 25, 346);
    			attr_dev(h1, "class", "svelte-1ehlss");
    			add_location(h1, file$7, 15, 4, 325);
    			attr_dev(div0, "class", "contain-logo svelte-1ehlss");
    			add_location(div0, file$7, 14, 2, 293);
    			attr_dev(ul, "class", "navbar svelte-1ehlss");
    			add_location(ul, file$7, 18, 4, 429);
    			attr_dev(div1, "class", "contain-navbar svelte-1ehlss");
    			add_location(div1, file$7, 17, 2, 395);
    			attr_dev(div2, "class", "wrapper svelte-1ehlss");
    			add_location(div2, file$7, 25, 2, 591);
    			attr_dev(span2, "class", "svelte-1ehlss");
    			add_location(span2, file$7, 39, 4, 929);
    			attr_dev(div3, "class", "language svelte-1ehlss");
    			add_location(div3, file$7, 37, 2, 893);
    			attr_dev(div4, "class", "container svelte-1ehlss");
    			add_location(div4, file$7, 13, 0, 266);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, h1);
    			append_dev(h1, span0);
    			append_dev(h1, span1);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, ul);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul, null);
    			}

    			append_dev(div4, t3);
    			append_dev(div4, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, t5);
    			append_dev(div3, span2);
    			mount_component(fa, span2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*navbar*/ 0) {
    				each_value_1 = navbar;
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_1, each0_lookup, ul, destroy_block, create_each_block_1, null, get_each_context_1);
    			}

    			if (dirty & /*navbar_logo*/ 0) {
    				each_value = navbar_logo;
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key_1);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value, each1_lookup, div2, destroy_block, create_each_block$1, null, get_each_context$1);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fa.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fa.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			destroy_component(fa);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Fa: Fa$1,
    		faCaretDown,
    		faCaretUp,
    		navbar,
    		navbar_logo
    	});

    	return [];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\components\home.svelte generated by Svelte v3.49.0 */

    const file$6 = "src\\components\\home.svelte";

    function create_fragment$6(ctx) {
    	let div6;
    	let div0;
    	let t0;
    	let div3;
    	let div1;
    	let h1;
    	let t1;
    	let span0;
    	let br;
    	let t2;
    	let t3;
    	let span1;
    	let t5;
    	let div2;
    	let button;
    	let t7;
    	let div5;
    	let div4;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			h1 = element("h1");
    			t1 = text("vous revez d'avoir un ");
    			span0 = element("span");
    			br = element("br");
    			t2 = text(" site web");
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = "Nous vous accompagmons dans la creation de votre site web de la meilleur\r\n        des facons possible";
    			t5 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "commencer";
    			t7 = space();
    			div5 = element("div");
    			div4 = element("div");
    			img = element("img");
    			attr_dev(div0, "class", "renverse svelte-l4qyiy");
    			add_location(div0, file$6, 17, 0, 230);
    			add_location(br, file$6, 32, 39, 390);
    			attr_dev(span0, "class", "svelte-l4qyiy");
    			add_location(span0, file$6, 32, 32, 383);
    			attr_dev(h1, "class", "svelte-l4qyiy");
    			add_location(h1, file$6, 32, 6, 357);
    			attr_dev(span1, "class", "svelte-l4qyiy");
    			add_location(span1, file$6, 33, 6, 425);
    			attr_dev(div1, "class", "contain-left-text");
    			add_location(div1, file$6, 31, 4, 318);
    			attr_dev(button, "class", "svelte-l4qyiy");
    			add_location(button, file$6, 39, 6, 615);
    			attr_dev(div2, "class", "contain-left-begin svelte-l4qyiy");
    			add_location(div2, file$6, 38, 4, 575);
    			attr_dev(div3, "class", "contain-left svelte-l4qyiy");
    			add_location(div3, file$6, 30, 2, 286);
    			if (!src_url_equal(img.src, img_src_value = /*src1*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$6, 45, 6, 741);
    			attr_dev(div4, "class", "contain-right-img");
    			add_location(div4, file$6, 44, 4, 702);
    			attr_dev(div5, "class", "contain-right svelte-l4qyiy");
    			add_location(div5, file$6, 43, 2, 669);
    			attr_dev(div6, "class", "home svelte-l4qyiy");
    			add_location(div6, file$6, 13, 0, 204);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div0);
    			append_dev(div6, t0);
    			append_dev(div6, div3);
    			append_dev(div3, div1);
    			append_dev(div1, h1);
    			append_dev(h1, t1);
    			append_dev(h1, span0);
    			append_dev(span0, br);
    			append_dev(span0, t2);
    			append_dev(div1, t3);
    			append_dev(div1, span1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, button);
    			append_dev(div6, t7);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	let src1 = '/build/person1.png';
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Fa: Fa$1, faCaretDown, faCaretUp, src1 });

    	$$self.$inject_state = $$props => {
    		if ('src1' in $$props) $$invalidate(0, src1 = $$props.src1);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src1];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\service.svelte generated by Svelte v3.49.0 */
    const file$5 = "src\\components\\service.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (62:4) {#each SERVICES as offeredService (offeredService.title)}
    function create_each_block(key_1, ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let h1;
    	let t1_value = /*offeredService*/ ctx[4].title + "";
    	let t1;
    	let t2;
    	let p;
    	let t3_value = /*offeredService*/ ctx[4].description + "";
    	let t3;
    	let t4;
    	let a;
    	let t5;
    	let t6;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			a = element("a");
    			t5 = text("Commencer");
    			t6 = space();
    			if (!src_url_equal(img.src, img_src_value = /*offeredService*/ ctx[4].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-3iw11j");
    			add_location(img, file$5, 65, 12, 1889);
    			attr_dev(div0, "class", "picture svelte-3iw11j");
    			add_location(div0, file$5, 64, 10, 1854);
    			attr_dev(h1, "class", "svelte-3iw11j");
    			add_location(h1, file$5, 67, 10, 1960);
    			attr_dev(p, "class", "svelte-3iw11j");
    			add_location(p, file$5, 68, 10, 2003);
    			attr_dev(a, "href", /*offeredService*/ ctx[4].link);
    			attr_dev(a, "class", "svelte-3iw11j");
    			add_location(a, file$5, 71, 10, 2076);
    			attr_dev(div1, "class", "content svelte-3iw11j");
    			add_location(div1, file$5, 63, 8, 1821);
    			attr_dev(div2, "class", "card svelte-3iw11j");
    			add_location(div2, file$5, 62, 6, 1793);
    			this.first = div2;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t0);
    			append_dev(div1, h1);
    			append_dev(h1, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    			append_dev(p, t3);
    			append_dev(div1, t4);
    			append_dev(div1, a);
    			append_dev(a, t5);
    			append_dev(div2, t6);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(62:4) {#each SERVICES as offeredService (offeredService.title)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div2;
    	let div0;
    	let h1;
    	let t1;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = SERVICES;
    	validate_each_argument(each_value);
    	const get_key = ctx => /*offeredService*/ ctx[4].title;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "We Offer Best Services";
    			t1 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "svelte-3iw11j");
    			add_location(h1, file$5, 58, 29, 1648);
    			attr_dev(div0, "class", "service-title svelte-3iw11j");
    			add_location(div0, file$5, 58, 2, 1621);
    			attr_dev(div1, "class", "content-categorie svelte-3iw11j");
    			add_location(div1, file$5, 60, 2, 1691);
    			attr_dev(div2, "class", "service svelte-3iw11j");
    			add_location(div2, file$5, 57, 0, 1596);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t1);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*SERVICES*/ 0) {
    				each_value = SERVICES;
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Service', slots, []);
    	let src1 = '/build/appMobile.png';
    	let src2 = '/build/appWeb.png';
    	let src3 = '/build/appDesign.png';
    	let src4 = '/build/appCourse.png';
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Service> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ src1, src2, src3, src4, SERVICES });

    	$$self.$inject_state = $$props => {
    		if ('src1' in $$props) src1 = $$props.src1;
    		if ('src2' in $$props) src2 = $$props.src2;
    		if ('src3' in $$props) src3 = $$props.src3;
    		if ('src4' in $$props) src4 = $$props.src4;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Service extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Service",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\project.svelte generated by Svelte v3.49.0 */

    const file$4 = "src\\components\\project.svelte";

    function create_fragment$4(ctx) {
    	let div14;
    	let div0;
    	let h10;
    	let t0;
    	let br0;
    	let t1;
    	let t2;
    	let p;
    	let t3;
    	let br1;
    	let t4;
    	let t5;
    	let div13;
    	let div3;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t6;
    	let div2;
    	let h11;
    	let span0;
    	let t8;
    	let br2;
    	let t9;
    	let t10;
    	let div6;
    	let div4;
    	let img1;
    	let img1_src_value;
    	let t11;
    	let div5;
    	let h12;
    	let span1;
    	let t13;
    	let br3;
    	let t14;
    	let t15;
    	let div9;
    	let div7;
    	let img2;
    	let img2_src_value;
    	let t16;
    	let div8;
    	let h13;
    	let span2;
    	let t18;
    	let br4;
    	let t19;
    	let t20;
    	let div12;
    	let div10;
    	let img3;
    	let img3_src_value;
    	let t21;
    	let div11;
    	let h14;
    	let span3;
    	let t23;
    	let br5;
    	let t24;

    	const block = {
    		c: function create() {
    			div14 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			t0 = text("Nous avons réalisé plus de 1200 projets par an ");
    			br0 = element("br");
    			t1 = text(" Réussir et compter");
    			t2 = space();
    			p = element("p");
    			t3 = text("Nous aidons chaque annees des centaines ");
    			br1 = element("br");
    			t4 = text("\r\n      d'entreprise a hemerger dans le domaine de la technologie , et ce travail travail\r\n      vas de la conception au suivit continu");
    			t5 = space();
    			div13 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			img0 = element("img");
    			t6 = space();
    			div2 = element("div");
    			h11 = element("h1");
    			span0 = element("span");
    			span0.textContent = "100+";
    			t8 = space();
    			br2 = element("br");
    			t9 = text(" Project completed");
    			t10 = space();
    			div6 = element("div");
    			div4 = element("div");
    			img1 = element("img");
    			t11 = space();
    			div5 = element("div");
    			h12 = element("h1");
    			span1 = element("span");
    			span1.textContent = "100+";
    			t13 = space();
    			br3 = element("br");
    			t14 = text(" Active Project");
    			t15 = space();
    			div9 = element("div");
    			div7 = element("div");
    			img2 = element("img");
    			t16 = space();
    			div8 = element("div");
    			h13 = element("h1");
    			span2 = element("span");
    			span2.textContent = "90+";
    			t18 = space();
    			br4 = element("br");
    			t19 = text(" Client Satisfied");
    			t20 = space();
    			div12 = element("div");
    			div10 = element("div");
    			img3 = element("img");
    			t21 = space();
    			div11 = element("div");
    			h14 = element("h1");
    			span3 = element("span");
    			span3.textContent = "56+";
    			t23 = space();
    			br5 = element("br");
    			t24 = text(" Country Available");
    			add_location(br0, file$4, 35, 53, 506);
    			attr_dev(h10, "class", "svelte-1ucq6a9");
    			add_location(h10, file$4, 34, 4, 447);
    			add_location(br1, file$4, 39, 46, 628);
    			attr_dev(p, "class", "project-paragraphe svelte-1ucq6a9");
    			add_location(p, file$4, 38, 4, 550);
    			attr_dev(div0, "class", "project-title");
    			add_location(div0, file$4, 33, 2, 414);
    			if (!src_url_equal(img0.src, img0_src_value = /*src1*/ ctx[0])) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "class", "svelte-1ucq6a9");
    			add_location(img0, file$4, 46, 36, 881);
    			attr_dev(div1, "class", "card-project-img svelte-1ucq6a9");
    			add_location(div1, file$4, 46, 6, 851);
    			attr_dev(span0, "class", "svelte-1ucq6a9");
    			add_location(span0, file$4, 48, 12, 965);
    			add_location(br2, file$4, 48, 32, 985);
    			attr_dev(h11, "class", "svelte-1ucq6a9");
    			add_location(h11, file$4, 48, 8, 961);
    			attr_dev(div2, "class", "card-project-text svelte-1ucq6a9");
    			add_location(div2, file$4, 47, 6, 920);
    			attr_dev(div3, "class", "card-project svelte-1ucq6a9");
    			add_location(div3, file$4, 45, 4, 817);
    			if (!src_url_equal(img1.src, img1_src_value = /*src2*/ ctx[1])) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			attr_dev(img1, "class", "svelte-1ucq6a9");
    			add_location(img1, file$4, 52, 36, 1110);
    			attr_dev(div4, "class", "card-project-img svelte-1ucq6a9");
    			add_location(div4, file$4, 52, 6, 1080);
    			attr_dev(span1, "class", "svelte-1ucq6a9");
    			add_location(span1, file$4, 54, 12, 1194);
    			add_location(br3, file$4, 54, 31, 1213);
    			attr_dev(h12, "class", "svelte-1ucq6a9");
    			add_location(h12, file$4, 54, 8, 1190);
    			attr_dev(div5, "class", "card-project-text svelte-1ucq6a9");
    			add_location(div5, file$4, 53, 6, 1149);
    			attr_dev(div6, "class", "card-project svelte-1ucq6a9");
    			add_location(div6, file$4, 51, 4, 1046);
    			if (!src_url_equal(img2.src, img2_src_value = /*src3*/ ctx[2])) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "");
    			attr_dev(img2, "class", "svelte-1ucq6a9");
    			add_location(img2, file$4, 58, 36, 1335);
    			attr_dev(div7, "class", "card-project-img svelte-1ucq6a9");
    			add_location(div7, file$4, 58, 6, 1305);
    			attr_dev(span2, "class", "svelte-1ucq6a9");
    			add_location(span2, file$4, 60, 12, 1419);
    			add_location(br4, file$4, 60, 30, 1437);
    			attr_dev(h13, "class", "svelte-1ucq6a9");
    			add_location(h13, file$4, 60, 8, 1415);
    			attr_dev(div8, "class", "card-project-text svelte-1ucq6a9");
    			add_location(div8, file$4, 59, 6, 1374);
    			attr_dev(div9, "class", "card-project svelte-1ucq6a9");
    			add_location(div9, file$4, 57, 4, 1271);
    			if (!src_url_equal(img3.src, img3_src_value = /*src4*/ ctx[3])) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "");
    			attr_dev(img3, "class", "svelte-1ucq6a9");
    			add_location(img3, file$4, 64, 36, 1561);
    			attr_dev(div10, "class", "card-project-img svelte-1ucq6a9");
    			add_location(div10, file$4, 64, 6, 1531);
    			attr_dev(span3, "class", "svelte-1ucq6a9");
    			add_location(span3, file$4, 66, 12, 1645);
    			add_location(br5, file$4, 66, 30, 1663);
    			attr_dev(h14, "class", "svelte-1ucq6a9");
    			add_location(h14, file$4, 66, 8, 1641);
    			attr_dev(div11, "class", "card-project-text svelte-1ucq6a9");
    			add_location(div11, file$4, 65, 6, 1600);
    			attr_dev(div12, "class", "card-project svelte-1ucq6a9");
    			add_location(div12, file$4, 63, 4, 1497);
    			attr_dev(div13, "class", "card svelte-1ucq6a9");
    			add_location(div13, file$4, 44, 2, 793);
    			attr_dev(div14, "class", "project svelte-1ucq6a9");
    			add_location(div14, file$4, 18, 0, 328);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div14, anchor);
    			append_dev(div14, div0);
    			append_dev(div0, h10);
    			append_dev(h10, t0);
    			append_dev(h10, br0);
    			append_dev(h10, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p);
    			append_dev(p, t3);
    			append_dev(p, br1);
    			append_dev(p, t4);
    			append_dev(div14, t5);
    			append_dev(div14, div13);
    			append_dev(div13, div3);
    			append_dev(div3, div1);
    			append_dev(div1, img0);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, h11);
    			append_dev(h11, span0);
    			append_dev(h11, t8);
    			append_dev(h11, br2);
    			append_dev(h11, t9);
    			append_dev(div13, t10);
    			append_dev(div13, div6);
    			append_dev(div6, div4);
    			append_dev(div4, img1);
    			append_dev(div6, t11);
    			append_dev(div6, div5);
    			append_dev(div5, h12);
    			append_dev(h12, span1);
    			append_dev(h12, t13);
    			append_dev(h12, br3);
    			append_dev(h12, t14);
    			append_dev(div13, t15);
    			append_dev(div13, div9);
    			append_dev(div9, div7);
    			append_dev(div7, img2);
    			append_dev(div9, t16);
    			append_dev(div9, div8);
    			append_dev(div8, h13);
    			append_dev(h13, span2);
    			append_dev(h13, t18);
    			append_dev(h13, br4);
    			append_dev(h13, t19);
    			append_dev(div13, t20);
    			append_dev(div13, div12);
    			append_dev(div12, div10);
    			append_dev(div10, img3);
    			append_dev(div12, t21);
    			append_dev(div12, div11);
    			append_dev(div11, h14);
    			append_dev(h14, span3);
    			append_dev(h14, t23);
    			append_dev(h14, br5);
    			append_dev(h14, t24);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div14);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Project', slots, []);
    	let src1 = '/build/verifier.png';
    	let src2 = '/build/reverifier.png';
    	let src3 = '/build/man.png';
    	let src4 = '/build/countries.png';
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Project> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Fa: Fa$1,
    		faCaretDown,
    		faCaretUp,
    		src1,
    		src2,
    		src3,
    		src4
    	});

    	$$self.$inject_state = $$props => {
    		if ('src1' in $$props) $$invalidate(0, src1 = $$props.src1);
    		if ('src2' in $$props) $$invalidate(1, src2 = $$props.src2);
    		if ('src3' in $$props) $$invalidate(2, src3 = $$props.src3);
    		if ('src4' in $$props) $$invalidate(3, src4 = $$props.src4);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src1, src2, src3, src4];
    }

    class Project extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Project",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\about.svelte generated by Svelte v3.49.0 */

    const file$3 = "src\\components\\about.svelte";

    function create_fragment$3(ctx) {
    	let div4;
    	let span0;
    	let t0;
    	let span1;
    	let t1;
    	let div0;
    	let h10;
    	let t3;
    	let p0;
    	let t4;
    	let div3;
    	let div1;
    	let span2;
    	let t6;
    	let h11;
    	let t8;
    	let p1;
    	let t10;
    	let p2;
    	let t12;
    	let a;
    	let t14;
    	let div2;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			span0 = element("span");
    			t0 = space();
    			span1 = element("span");
    			t1 = space();
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Qui sommes nous !";
    			t3 = space();
    			p0 = element("p");
    			t4 = space();
    			div3 = element("div");
    			div1 = element("div");
    			span2 = element("span");
    			span2.textContent = "Notre but";
    			t6 = space();
    			h11 = element("h1");
    			h11.textContent = "Internet n'appartient a personne !";
    			t8 = space();
    			p1 = element("p");
    			p1.textContent = "Nous avons cree Prisma , dans le but d'aider les petites et moyennes\r\n        entreprise a grandire et a ce faire un nom , ou plutot une image dans le\r\n        domaine de la tec , pour nous tout le mon de a la possibilite d'exister\r\n        sur interne ,nous vous accompagnons de la creer la creation de votre\r\n        project a la maintenant et la durabilite , nous somme une equipe de plus\r\n        de 60 pesonnes , et nous avons batis cette entreprise afin de rendre le\r\n        web meilleur";
    			t10 = space();
    			p2 = element("p");
    			p2.textContent = "Nous avons cree Prisma , dans le but d'aider les petites et moyennes\r\n        entreprise a grandire et a ce faire un nom , ou plutot une image dans le\r\n        domaine de la tec , pour nous tout le mon de a la possibilite d'exister\r\n        sur interne ,nous vous accompagnons de la creer la creation de votre\r\n        project a la maintenant et la durabilite , nous somme une equipe de plus\r\n        de 60 pesonnes , et nous avons batis cette entreprise afin de rendre le\r\n        web meilleur";
    			t12 = space();
    			a = element("a");
    			a.textContent = "Savoir plus";
    			t14 = space();
    			div2 = element("div");
    			img = element("img");
    			attr_dev(span0, "class", "buble svelte-1qjopgs");
    			add_location(span0, file$3, 5, 0, 90);
    			attr_dev(span1, "class", "buble buble1 svelte-1qjopgs");
    			add_location(span1, file$3, 6, 0, 119);
    			attr_dev(h10, "class", "theTitle svelte-1qjopgs");
    			add_location(h10, file$3, 8, 4, 189);
    			attr_dev(p0, "class", "about-paragraphe");
    			add_location(p0, file$3, 10, 4, 240);
    			attr_dev(div0, "class", "about-title svelte-1qjopgs");
    			add_location(div0, file$3, 7, 2, 158);
    			attr_dev(span2, "class", "but svelte-1qjopgs");
    			add_location(span2, file$3, 15, 6, 347);
    			attr_dev(h11, "class", "card-about-text-title svelte-1qjopgs");
    			add_location(h11, file$3, 16, 6, 389);
    			attr_dev(p1, "class", "card-about-text-paragraphe svelte-1qjopgs");
    			add_location(p1, file$3, 17, 6, 470);
    			attr_dev(p2, "class", "card-about-text-paragraphe svelte-1qjopgs");
    			add_location(p2, file$3, 26, 6, 1032);
    			attr_dev(a, "class", "button svelte-1qjopgs");
    			attr_dev(a, "href", "#");
    			add_location(a, file$3, 36, 6, 1596);
    			attr_dev(div1, "class", "card-about-text svelte-1qjopgs");
    			add_location(div1, file$3, 14, 4, 310);
    			if (!src_url_equal(img.src, img_src_value = /*src1*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-1qjopgs");
    			add_location(img, file$3, 40, 6, 1694);
    			attr_dev(div2, "class", "card-about-img svelte-1qjopgs");
    			add_location(div2, file$3, 39, 4, 1658);
    			attr_dev(div3, "class", "card svelte-1qjopgs");
    			add_location(div3, file$3, 12, 2, 284);
    			attr_dev(div4, "class", "about  svelte-1qjopgs");
    			attr_dev(div4, "id", "about");
    			add_location(div4, file$3, 4, 0, 57);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, span0);
    			append_dev(div4, t0);
    			append_dev(div4, span1);
    			append_dev(div4, t1);
    			append_dev(div4, div0);
    			append_dev(div0, h10);
    			append_dev(div0, t3);
    			append_dev(div0, p0);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, span2);
    			append_dev(div1, t6);
    			append_dev(div1, h11);
    			append_dev(div1, t8);
    			append_dev(div1, p1);
    			append_dev(div1, t10);
    			append_dev(div1, p2);
    			append_dev(div1, t12);
    			append_dev(div1, a);
    			append_dev(div3, t14);
    			append_dev(div3, div2);
    			append_dev(div2, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	let src1 = '/build/about.png';
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ src1 });

    	$$self.$inject_state = $$props => {
    		if ('src1' in $$props) $$invalidate(0, src1 = $$props.src1);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src1];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\feedback.svelte generated by Svelte v3.49.0 */

    const file$2 = "src\\components\\feedback.svelte";

    function create_fragment$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "feedback svelte-hejuy5");
    			add_location(div, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Feedback', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Feedback> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Feedback extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Feedback",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\footer.svelte generated by Svelte v3.49.0 */

    const file$1 = "src\\components\\footer.svelte";

    function create_fragment$1(ctx) {
    	let footer;
    	let div0;
    	let h30;
    	let t0;
    	let span0;
    	let t2;
    	let p0;
    	let a0;
    	let t4;
    	let a1;
    	let t6;
    	let a2;
    	let t8;
    	let a3;
    	let t10;
    	let p1;
    	let t11;
    	let strong0;
    	let t13;
    	let t14;
    	let div2;
    	let h31;
    	let t16;
    	let p2;
    	let t18;
    	let div1;
    	let button0;
    	let t20;
    	let button1;
    	let t22;
    	let div4;
    	let p3;
    	let span1;
    	let t24;
    	let strong1;
    	let t26;
    	let t27;
    	let div3;
    	let a4;
    	let i0;
    	let t28;
    	let a5;
    	let i1;
    	let t29;
    	let a6;
    	let i2;
    	let t30;
    	let a7;
    	let i3;
    	let t31;
    	let a8;
    	let i4;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div0 = element("div");
    			h30 = element("h3");
    			t0 = text("Prisma-");
    			span0 = element("span");
    			span0.textContent = "company";
    			t2 = space();
    			p0 = element("p");
    			a0 = element("a");
    			a0.textContent = "Home";
    			t4 = text("\r\n      |\r\n      ");
    			a1 = element("a");
    			a1.textContent = "Service";
    			t6 = text("\r\n      |\r\n      ");
    			a2 = element("a");
    			a2.textContent = "Project";
    			t8 = text("\r\n      |\r\n      ");
    			a3 = element("a");
    			a3.textContent = "About";
    			t10 = space();
    			p1 = element("p");
    			t11 = text("Copyright © 2021 ");
    			strong0 = element("strong");
    			strong0.textContent = "Prisma-company";
    			t13 = text(" Tout droit reserv");
    			t14 = space();
    			div2 = element("div");
    			h31 = element("h3");
    			h31.textContent = "About Company";
    			t16 = space();
    			p2 = element("p");
    			p2.textContent = "Dev-scott - cameroun douala";
    			t18 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "More infos";
    			t20 = space();
    			button1 = element("button");
    			button1.textContent = "Contact us";
    			t22 = space();
    			div4 = element("div");
    			p3 = element("p");
    			span1 = element("span");
    			span1.textContent = "About the company";
    			t24 = space();
    			strong1 = element("strong");
    			strong1.textContent = "TRIVIA COMPANY";
    			t26 = text(" we created this company me and my teammate\r\n      in order to solve the problem of slowness and difficulty of ticket reservation\r\n      in the agencies");
    			t27 = space();
    			div3 = element("div");
    			a4 = element("a");
    			i0 = element("i");
    			t28 = space();
    			a5 = element("a");
    			i1 = element("i");
    			t29 = space();
    			a6 = element("a");
    			i2 = element("i");
    			t30 = space();
    			a7 = element("a");
    			i3 = element("i");
    			t31 = space();
    			a8 = element("a");
    			i4 = element("i");
    			attr_dev(span0, "class", "svelte-1u2t2os");
    			add_location(span0, file$1, 8, 15, 215);
    			attr_dev(h30, "class", "svelte-1u2t2os");
    			add_location(h30, file$1, 8, 4, 204);
    			attr_dev(a0, "href", "home");
    			attr_dev(a0, "class", "svelte-1u2t2os");
    			add_location(a0, file$1, 11, 6, 280);
    			attr_dev(a1, "href", "service");
    			attr_dev(a1, "class", "svelte-1u2t2os");
    			add_location(a1, file$1, 13, 6, 320);
    			attr_dev(a2, "href", "project");
    			attr_dev(a2, "class", "svelte-1u2t2os");
    			add_location(a2, file$1, 15, 6, 366);
    			attr_dev(a3, "href", "about");
    			attr_dev(a3, "class", "svelte-1u2t2os");
    			add_location(a3, file$1, 17, 6, 412);
    			attr_dev(p0, "class", "footer-links svelte-1u2t2os");
    			add_location(p0, file$1, 10, 4, 248);
    			add_location(strong0, file$1, 21, 23, 511);
    			attr_dev(p1, "class", "footer-company-name svelte-1u2t2os");
    			add_location(p1, file$1, 20, 4, 455);
    			attr_dev(div0, "class", "footer-left svelte-1u2t2os");
    			add_location(div0, file$1, 7, 2, 173);
    			attr_dev(h31, "class", "about_company svelte-1u2t2os");
    			add_location(h31, file$1, 26, 4, 619);
    			attr_dev(p2, "class", "about_paragraphe svelte-1u2t2os");
    			add_location(p2, file$1, 28, 4, 671);
    			attr_dev(button0, "class", "btn_1 svelte-1u2t2os");
    			add_location(button0, file$1, 31, 6, 769);
    			attr_dev(button1, "class", "btn_2 svelte-1u2t2os");
    			add_location(button1, file$1, 32, 6, 818);
    			attr_dev(div1, "class", "TwoButton svelte-1u2t2os");
    			add_location(div1, file$1, 30, 4, 738);
    			attr_dev(div2, "class", "footer-center svelte-1u2t2os");
    			add_location(div2, file$1, 25, 2, 586);
    			attr_dev(span1, "class", "svelte-1u2t2os");
    			add_location(span1, file$1, 38, 6, 959);
    			add_location(strong1, file$1, 39, 6, 997);
    			attr_dev(p3, "class", "footer-company-about svelte-1u2t2os");
    			add_location(p3, file$1, 37, 4, 919);
    			attr_dev(i0, "class", "fa fa-facebook svelte-1u2t2os");
    			add_location(i0, file$1, 44, 18, 1242);
    			attr_dev(a4, "href", "#");
    			attr_dev(a4, "class", "svelte-1u2t2os");
    			add_location(a4, file$1, 44, 6, 1230);
    			attr_dev(i1, "class", "fa fa-instagram svelte-1u2t2os");
    			add_location(i1, file$1, 45, 18, 1294);
    			attr_dev(a5, "href", "#");
    			attr_dev(a5, "class", "svelte-1u2t2os");
    			add_location(a5, file$1, 45, 6, 1282);
    			attr_dev(i2, "class", "fa fa-linkedin svelte-1u2t2os");
    			add_location(i2, file$1, 46, 18, 1347);
    			attr_dev(a6, "href", "#");
    			attr_dev(a6, "class", "svelte-1u2t2os");
    			add_location(a6, file$1, 46, 6, 1335);
    			attr_dev(i3, "class", "fa fa-twitter svelte-1u2t2os");
    			add_location(i3, file$1, 47, 18, 1399);
    			attr_dev(a7, "href", "#");
    			attr_dev(a7, "class", "svelte-1u2t2os");
    			add_location(a7, file$1, 47, 6, 1387);
    			attr_dev(i4, "class", "fa fa-youtube svelte-1u2t2os");
    			add_location(i4, file$1, 48, 18, 1450);
    			attr_dev(a8, "href", "#");
    			attr_dev(a8, "class", "svelte-1u2t2os");
    			add_location(a8, file$1, 48, 6, 1438);
    			attr_dev(div3, "class", "footer-icons svelte-1u2t2os");
    			add_location(div3, file$1, 43, 4, 1196);
    			attr_dev(div4, "class", "footer-right svelte-1u2t2os");
    			add_location(div4, file$1, 36, 2, 887);
    			attr_dev(footer, "class", "footer-distributed svelte-1u2t2os");
    			add_location(footer, file$1, 6, 0, 134);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div0);
    			append_dev(div0, h30);
    			append_dev(h30, t0);
    			append_dev(h30, span0);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(p0, a0);
    			append_dev(p0, t4);
    			append_dev(p0, a1);
    			append_dev(p0, t6);
    			append_dev(p0, a2);
    			append_dev(p0, t8);
    			append_dev(p0, a3);
    			append_dev(div0, t10);
    			append_dev(div0, p1);
    			append_dev(p1, t11);
    			append_dev(p1, strong0);
    			append_dev(p1, t13);
    			append_dev(footer, t14);
    			append_dev(footer, div2);
    			append_dev(div2, h31);
    			append_dev(div2, t16);
    			append_dev(div2, p2);
    			append_dev(div2, t18);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(div1, t20);
    			append_dev(div1, button1);
    			append_dev(footer, t22);
    			append_dev(footer, div4);
    			append_dev(div4, p3);
    			append_dev(p3, span1);
    			append_dev(p3, t24);
    			append_dev(p3, strong1);
    			append_dev(p3, t26);
    			append_dev(div4, t27);
    			append_dev(div4, div3);
    			append_dev(div3, a4);
    			append_dev(a4, i0);
    			append_dev(div3, t28);
    			append_dev(div3, a5);
    			append_dev(a5, i1);
    			append_dev(div3, t29);
    			append_dev(div3, a6);
    			append_dev(a6, i2);
    			append_dev(div3, t30);
    			append_dev(div3, a7);
    			append_dev(a7, i3);
    			append_dev(div3, t31);
    			append_dev(div3, a8);
    			append_dev(a8, i4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	let src1 = '/build/facebook.png';
    	let src2 = '/build/instagram.png';
    	let src3 = '/build/twitter.png';
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ src1, src2, src3 });

    	$$self.$inject_state = $$props => {
    		if ('src1' in $$props) src1 = $$props.src1;
    		if ('src2' in $$props) src2 = $$props.src2;
    		if ('src3' in $$props) src3 = $$props.src3;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.49.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div;
    	let navbar;
    	let t0;
    	let home;
    	let t1;
    	let service;
    	let t2;
    	let project;
    	let t3;
    	let about;
    	let t4;
    	let feedback;
    	let t5;
    	let footer;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	home = new Home({ $$inline: true });
    	service = new Service({ $$inline: true });
    	project = new Project({ $$inline: true });
    	about = new About({ $$inline: true });
    	feedback = new Feedback({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			create_component(home.$$.fragment);
    			t1 = space();
    			create_component(service.$$.fragment);
    			t2 = space();
    			create_component(project.$$.fragment);
    			t3 = space();
    			create_component(about.$$.fragment);
    			t4 = space();
    			create_component(feedback.$$.fragment);
    			t5 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(div, "class", "container");
    			add_location(div, file, 12, 0, 394);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(navbar, div, null);
    			append_dev(div, t0);
    			mount_component(home, div, null);
    			append_dev(div, t1);
    			mount_component(service, div, null);
    			append_dev(div, t2);
    			mount_component(project, div, null);
    			append_dev(div, t3);
    			mount_component(about, div, null);
    			append_dev(div, t4);
    			mount_component(feedback, div, null);
    			append_dev(div, t5);
    			mount_component(footer, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(home.$$.fragment, local);
    			transition_in(service.$$.fragment, local);
    			transition_in(project.$$.fragment, local);
    			transition_in(about.$$.fragment, local);
    			transition_in(feedback.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(home.$$.fragment, local);
    			transition_out(service.$$.fragment, local);
    			transition_out(project.$$.fragment, local);
    			transition_out(about.$$.fragment, local);
    			transition_out(feedback.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(navbar);
    			destroy_component(home);
    			destroy_component(service);
    			destroy_component(project);
    			destroy_component(about);
    			destroy_component(feedback);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Navbar,
    		Home,
    		Service,
    		Project,
    		About,
    		Feedback,
    		Footer
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map

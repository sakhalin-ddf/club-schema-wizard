/**
 * @typedef {Function} ClubSchemaWizardGetInfoTextFunction
 * @returns {Promise<string>}
 */

/**
 * @typedef {Object} ClubSchemaWizardOptions
 * @property {number} fieldWidth
 * @property {number} fieldHeight
 * @property {number} itemWidth
 * @property {number} itemHeight
 * @property {number} itemGridStep
 * @property {string} itemDefaultColor
 * @property {string} infoDefaultColor
 * @property {string} addTextLabel
 * @property {string} addAdminLabel
 * @property {Function} onAddInfo
 * @property {Function} onRemoveInfo
 * @property {Function} onChangeItemColor
 * @property {Function} onChangeInfoColor
 * @property {Function} onChangeItemPosition
 * @property {Function} onChangeInfoPosition
 * @property {Function} onChange
 * @property {ClubSchemaWizardGetInfoTextFunction} getInfoText
 */

/**
 * @typedef {Object} ClubSchemaWizardItem
 * @property {!string} id
 * @property {!string} title
 * @property {!string} type
 * @property {?string} color
 * @property {?number} top
 * @property {?number} left
 */

/**
 * @typedef {Object} ClubSchemaWizardSchemaInfo
 * @property {?string} id
 * @property {!string} type
 * @property {!string} text
 * @property {!string} color
 * @property {!number} top
 * @property {!number} left
 */

/**
 * @typedef {Object} ClubSchemaWizardSchemaItem
 * @property {!string} id
 * @property {!string} title
 * @property {!string} type
 * @property {?string} color
 * @property {!number} top
 * @property {!number} left
 */

/**
 * @typedef {Object} ClubSchemaWizardSchema
 * @property {Array<ClubSchemaWizardSchemaInfo>} info
 * @property {Array<ClubSchemaWizardSchemaItem>} items
 */

/**
 * @class ClubSchemaWizard
 */
let ClubSchemaWizard = (() => {
    function onElementRemoved(element, callback) {
        const observer = new MutationObserver(function (mutations) {
            if (document.body.contains(element) === false) {
                callback();
                this.disconnect();
            }
        });

        observer.observe(element.parentElement, {childList: true});
    }

    /**
     * @class ClubSchemaWizard
     */
    class ClubSchemaWizard {
        /** @type {ClubSchemaWizardOptions} */
        #options;

        /** @type {HTMLElement} */
        #$el;

        /** @type {HTMLElement} */
        #$field;

        /** @type {HTMLElement} */
        #$sandbox;

        /** @type {HTMLElement} */
        #$hoverContainer;

        /** @type {HTMLElement} */
        #$hoverElement;

        /** @type {?string} */
        #activeItemId;

        /** @type {?string} */
        #activeInfoId;

        /** @type {Array<number>} */
        #activeElementOffset = [0, 0];

        /** @type {Map<string, ClubSchemaWizardItem>} */
        #items = new Map();

        /** @type {Map<string, ClubSchemaWizardSchemaInfo>} */
        #info = new Map();

        /** @type {Map<string, HTMLElement>} */
        #$elements = new Map();

        /**
         * @param {string|HTMLElement} element
         * @param {ClubSchemaWizardOptions} options
         */
        constructor(element, options = {}) {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }

            if (element instanceof HTMLElement === false) {
                throw new Error('F5CenterClubSchemaWizard should be initialized with element or selector');
            }

            this.#options = Object.assign({
                fieldWidth: 500,
                fieldHeight: 500,
                itemWidth: 32,
                itemHeight: 32,
                itemGridStep: 8,
                itemDefaultColor: '#ffffff',
                infoDefaultColor: '#000000',
                addTextLabel: 'Add text',
                addAdminLabel: 'Add admin',
                getInfoText: getInfoTextWithPrompt,
                onAddInfo: noop,
                onRemoveInfo: noop,
                onChangeItemColor: noop,
                onChangeInfoColor: noop,
                onChangeItemPosition: noop,
                onChangeInfoPosition: noop,
                onChange: noop,
            }, options);

            /**
             * @type {HTMLElement}
             * @private
             */
            this.#$el = element;

            this.#$el.classList.add('club-schema-wizard');

            this.#$el.style.setProperty('--field-width', `${this.#options.fieldWidth}px`)
            this.#$el.style.setProperty('--field-height', `${this.#options.fieldHeight}px`)
            this.#$el.style.setProperty('--item-width', `${this.#options.itemWidth}px`)
            this.#$el.style.setProperty('--item-height', `${this.#options.itemHeight}px`)

            this.#$el.innerHTML = `
<div class="csw-wrapper">
    <div class="csw-field"></div>
    <div class="csw-controls">
        <div class="csw-buttons">
            <button type="button" data-add-info="text">${this.#options.addTextLabel}</button>
            <button type="button" data-add-info="admin">${this.#options.addAdminLabel}</button>
        </div>
        
        <div class="csw-sandbox"></div>
        
        <div class="csw-hover-container"></div>
    </div>
</div>
`;

            this.#$field = this.#$el.querySelector('.csw-field');
            this.#$sandbox = this.#$el.querySelector('.csw-sandbox');
            this.#$hoverContainer = this.#$el.querySelector('.csw-hover-container');

            this.#registerEvents();
        }

        /**
         * Register DOM events of plugin
         */
        #registerEvents() {
            let handleClick = this.#handleClick.bind(this);
            let handleMousedown = this.#handleMousedown.bind(this);
            let handleMousemove = this.#handleMousemove.bind(this);
            let handleMouseup = this.#handleMouseup.bind(this);
            let handleKeydown = this.#handleKeydown.bind(this);
            let handleChange = this.#handleChange.bind(this);

            this.#$el.addEventListener('click', handleClick);
            this.#$el.addEventListener('mousedown', handleMousedown);
            this.#$el.addEventListener('keydown', handleKeydown);
            this.#$el.addEventListener('change', handleChange);
            document.addEventListener('mousemove', handleMousemove);
            document.addEventListener('mouseup', handleMouseup);

            onElementRemoved(this.#$el, () => {
                this.#$el?.removeEventListener('click', handleClick);
                this.#$el?.removeEventListener('mousedown', handleMousedown);
                this.#$el?.removeEventListener('keydown', handleKeydown);
                this.#$el?.removeEventListener('change', handleChange);
                document.removeEventListener('mousemove', handleMousemove);
                document.removeEventListener('mouseup', handleMouseup);

                this.#items.clear();
                this.#$elements.clear();
            });
        }

        /**
         * @param {MouseEvent} e
         */
        #handleClick(e) {
            let $item = e.target.closest('.csw-item, .csw-info');
            let id = $item?.dataset?.id;

            if (id && e.target.matches('.csw-remove')) {
                this.#handleClickRemove(e, id);
            } else if (e.target.matches('[data-add-info]')) {
                this.#handleClickAddInfo(e, e.target.dataset.addInfo);
            }
        }

        /**
         * @param {MouseEvent} e
         * @param {string} id
         */
        #handleClickRemove(e, id) {
            let item = this.#items.get(id);
            let info = this.#info.get(id);

            if (item) {
                item.top = null;
                item.left = null;

                this.#options.onChangeItemPosition(Object.assign({}, item));
                this.#options.onChange();
            }

            if (info) {
                this.#options.onRemoveInfo(Object.assign({}, info));
                this.#options.onChange();

                this.#$elements.get(id).remove();

                this.#info.delete(id);
                this.#$elements.delete(id);
            }

            this.#renderItems();
        }

        /**
         * @param {MouseEvent} e
         * @param {string} type
         */
        #handleClickAddInfo(e, type) {
            let textPromise;

            if (type === 'text') {
                textPromise = this.#options.getInfoText();
            } else if (type === 'admin') {
                textPromise = Promise.resolve("СТОЙКА\nАДМИНИСТРАТОРА");
            }

            textPromise.then(text => {
                const id = generateInfoId(type);
                const info = {
                    id,
                    type,
                    text,
                    color: this.#options.infoDefaultColor,
                    top: 30,
                    left: 30,
                };

                this.#info.set(id, info);

                this.#options.onAddInfo(Object.assign({}, info));
                this.#options.onChange();

                this.#renderItems();
            });
        }

        /**
         * @param {MouseEvent} e
         */
        #handleMousedown(e) {
            this.#activeItemId = null;
            this.#activeInfoId = null;
            this.#$hoverElement = null;
            this.#$hoverContainer.innerHTML = '';

            if (e.buttons !== 1) {
                // clicked not left mouse button
                return;
            }

            if (e.target.matches('.csw-item .csw-item-title')) {
                this.#handleMousedownItem(e);
            } else if (e.target.matches('.csw-info, .csw-info .csw-info-text')) {
                this.#handleMousedownInfo(e);
            }
        }

        /**
         * @param {MouseEvent} e
         */
        #handleMousedownItem(e) {
            let $item = e.target.closest('.csw-item');
            let id = $item?.dataset?.id;

            if (!id) {
                return;
            }

            this.#activeElementOffset = [0, 0];
            this.#activeElementOffset = this.#calcItemPosition(e.x, e.y, e.target, false);

            let item = this.#items.get(id);

            this.#activeItemId = id;
            this.#$hoverElement = this.#createElementItem(item);

            let [left, top] = this.#calcItemPosition(e.x, e.y, this.#$el);

            this.#$hoverElement.style.left = `${left}px`;
            this.#$hoverElement.style.top = `${top}px`;

            this.#$hoverContainer.append(this.#$hoverElement);
        }

        /**
         * @param {MouseEvent} e
         */
        #handleMousedownInfo(e) {
            let $info = e.target.closest('.csw-info');
            let id = $info?.dataset?.id;

            if (!id) {
                return;
            }

            this.#activeElementOffset = [0, 0];
            this.#activeElementOffset = this.#calcItemPosition(e.x, e.y, e.target, false);

            let info = this.#info.get(id);

            this.#activeInfoId = id;
            this.#$hoverElement = this.#createElementInfo(info);

            let [left, top] = this.#calcItemPosition(e.x, e.y, this.#$el, false);

            this.#$hoverElement.style.left = `${left}px`;
            this.#$hoverElement.style.top = `${top}px`;

            this.#$hoverContainer.append(this.#$hoverElement);
        }

        /**
         * @param {MouseEvent} e
         */
        #handleMousemove(e) {
            if (!this.#$hoverElement) {
                return;
            }

            let isItem = !!this.#activeItemId;

            let [left, top] = this.#calcItemPosition(e.x, e.y, this.#$el, isItem);

            this.#$hoverElement.style.left = `${left}px`;
            this.#$hoverElement.style.top = `${top}px`;
        }

        /**
         * @param {MouseEvent} e
         */
        #handleMouseup(e) {
            if (!this.#$hoverElement) {
                return;
            }

            let itemOrInfo = this.#activeItemId ? this.#items.get(this.#activeItemId) : this.#info.get(this.#activeInfoId);
            let $itemOrInfo = this.#$elements.get(this.#activeItemId || this.#activeInfoId);

            if (itemOrInfo) {
                if (this.#$field.contains(e.target)) {
                    let [left, top] = this.#calcItemPosition(e.x, e.y, this.#$field, !!this.#activeItemId);

                    itemOrInfo.left = left;
                    itemOrInfo.top = top;
                }

                this.#renderItems();
            }

            if ($itemOrInfo) {
                $itemOrInfo.focus();
            }

            if (this.#activeItemId) {
                this.#options.onChangeItemPosition(Object.assign({}, itemOrInfo));
            } else {
                this.#options.onChangeInfoPosition(Object.assign({}, itemOrInfo));
            }

            this.#options.onChange();

            this.#$hoverElement.remove();
            this.#$hoverElement = null;
            this.#activeItemId = null;
            this.#activeInfoId = null;
        }

        /**
         * @param {KeyboardEvent} e
         */
        #handleKeydown(e) {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) === false) {
                return;
            }

            let activeElement = document.activeElement;

            if (document.activeElement?.matches('.csw-item') !== true) {
                return;
            }

            let id = activeElement.dataset.id;

            if (!id) {
                return;
            }

            let item = this.#items.get(id);

            if (!item) {
                return;
            }

            if (item.top === null || item.left === null) {
                return;
            }

            e.preventDefault();

            let step = this.#options.itemGridStep || 1;

            switch (e.key) {
                case 'ArrowUp':
                    item.top -= step;
                    break;
                case 'ArrowDown':
                    item.top += step;
                    break;
                case 'ArrowLeft':
                    item.left -= step;
                    break;
                case 'ArrowRight':
                    item.left += step;
                    break;
            }

            this.#renderItems();

            activeElement.focus();
        }

        /**
         * @param {InputEvent} e
         */
        #handleChange(e) {
            let $itemOrInfo = e.target.closest('.csw-item, .csw-info');
            let id = $itemOrInfo?.dataset?.id;

            if (!id) {
                return;
            }

            if (e.target.matches('.csw-item input[type="color"]')) {
                this.#handleChangeItemColor(e, id);
            } else if (e.target.matches('.csw-info input[type="color"]')) {
                this.#handleChangeInfoColor(e, id);
            }
        }

        /**
         * @param {InputEvent} e
         * @param {string} id
         */
        #handleChangeItemColor(e, id) {
            let item = this.#items.get(id);

            item.color = e.target.value;

            this.#options.onChangeItemColor(Object.assign({}, item));
            this.#options.onChange();

            this.#renderItems();
        }

        /**
         * @param {InputEvent} e
         * @param {string} id
         */
        #handleChangeInfoColor(e, id) {
            let info = this.#info.get(id);

            info.color = e.target.value;

            this.#options.onChangeInfoColor(Object.assign({}, info));
            this.#options.onChange();

            this.#renderItems();
        }

        /**
         * @param {number} x
         * @param {number} y
         * @param {HTMLElement} $element
         * @param {boolean} useSteps
         * @returns {number[]}
         */
        #calcItemPosition(x, y, $element, useSteps = true) {
            let rect = $element.getBoundingClientRect();
            let step = this.#options.itemGridStep;

            return [
                x - rect.x - this.#activeElementOffset[0],
                y - rect.y - this.#activeElementOffset[1],
            ].map((value) => {
                return useSteps && step > 1 ? Math.round(value / step) * step : value;
            });
        }

        /**
         * @param {Array<ClubSchemaWizardItem>} items
         */
        loadItems(items) {
            validateLoadItems(items);

            this.#items.clear();

            for (let item of items) {
                this.#items.set(
                    item.id,
                    Object.assign({}, item, {
                        color: null,
                        top: null,
                        left: null,
                    }),
                );
            }

            this.#renderItems();
        }

        /**
         * @param {ClubSchemaWizardSchema} schema
         */
        loadSchema(schema) {
            validateLoadSchema(schema);

            for (let schemaInfo of schema.info) {
                const id = generateInfoId(schemaInfo.type);
                const info = {
                    id,
                    type: schemaInfo.type,
                    text: schemaInfo.text,
                    color: schemaInfo.color,
                    top: schemaInfo.top,
                    left: schemaInfo.left,
                };

                this.#info.set(id, info);
            }

            for (let schemaItem of schema.items) {
                let item = this.#items.get(schemaItem.id);

                if (!item) {
                    continue;
                }

                item.top = schemaItem.top;
                item.left = schemaItem.left;
                item.color = schemaItem.color;
            }

            this.#renderItems();
        }

        /**
         * @returns {ClubSchemaWizardSchema}
         */
        buildSchema() {
            let items = [];
            let info = [];

            for (let item of this.#items.values()) {
                if (item.top !== null && item.left !== null) {
                    items.push(Object.assign({}, item));
                }
            }

            for (let i of this.#info.values()) {
                info.push(Object.assign({}, i));
            }

            return {
                info,
                items,
            };
        }

        /**
         * @returns {Array<{id: string, title: string, type: string}>}
         */
        getNotPlacedItems() {
            return Array.from(this.#items.values()).map(item => ({
                id: item.id,
                title: item.title,
                type: item.type,
            }))
        }

        /**
         * Render all item and info elements in csw-field and csw-sandbox
         */
        #renderItems() {
            for (let item of this.#items.values()) {
                let $item;

                if (this.#$elements.has(item.id)) {
                    $item = this.#$elements.get(item.id);
                } else {
                    $item = this.#createElementItem(item);

                    this.#$elements.set(item.id, $item);
                }

                $item.style.setProperty('--color', formatColorValue(item.color, this.#options.itemDefaultColor));

                if (item.top !== null && item.left !== null) {
                    item.top = Math.min(Math.max(item.top, 0), this.#options.fieldHeight - this.#options.itemHeight);
                    item.left = Math.min(Math.max(item.left, 0), this.#options.fieldWidth - this.#options.itemWidth);

                    $item.style.top = `${item.top}px`;
                    $item.style.left = `${item.left}px`;

                    this.#$field.append($item);
                } else {
                    $item.style.top = null;
                    $item.style.left = null;

                    this.#$sandbox.append($item);
                }
            }

            for (let info of this.#info.values()) {
                let $info;

                if (this.#$elements.has(info.id)) {
                    $info = this.#$elements.get(info.id);
                } else {
                    $info = this.#createElementInfo(info);

                    this.#$elements.set(info.id, $info);
                }

                $info.style.setProperty('--color', formatColorValue(info.color, this.#options.infoDefaultColor));

                info.top = Math.min(Math.max(info.top, 0), this.#options.fieldHeight);
                info.left = Math.min(Math.max(info.left, 0), this.#options.fieldWidth);

                $info.style.top = `${info.top}px`;
                $info.style.left = `${info.left}px`;

                this.#$field.append($info);
            }
        }

        /**
         * @param {ClubSchemaWizardItem} item
         * @returns {HTMLElement}
         */
        #createElementItem(item) {
            const $item = document.createElement('div');

            $item.classList.add('csw-item');
            $item.dataset.id = item.id;
            $item.tabIndex = 1;

            $item.innerHTML = `
<div class="csw-item-inner">
    <div class="csw-item-title">${htmlEncode(item.title)}</div>
    <button class="csw-remove"></button>
    <label class="csw-colorpicker"><input type="color" value="${formatColorValue(item.color, this.#options.itemDefaultColor)}"></label>
</div>
`;
            return $item;
        }

        /**
         * @param {ClubSchemaWizardSchemaInfo} info
         */
        #createElementInfo(info) {
            const $item = document.createElement('div');

            $item.classList.add('csw-info');
            $item.classList.add(`csw-info-type-${info.type}`);
            $item.dataset.id = info.id;
            $item.tabIndex = 1;

            $item.innerHTML = `
<div class="csw-info-inner">
    <div class="csw-info-text">${htmlEncode(info.text)}</div>
    <button class="csw-remove"></button>
    <label class="csw-colorpicker"><input type="color" value="${formatColorValue(info.color, this.#options.infoDefaultColor)}"></label>
</div>
`;

            return $item;
        }
    }

    /**
     * @param {string} color
     * @param {string} defaultColor
     * @returns {string}
     */
    function formatColorValue(color, defaultColor) {
        if (!color) {
            return defaultColor;
        }

        let ctx = document.createElement("canvas").getContext("2d");

        ctx.fillStyle = color;

        return typeof ctx.fillStyle === 'string' && /^#[\da-f]{6}$/i.test(ctx.fillStyle) ? ctx.fillStyle : defaultColor;
    }

    /**
     * @param {Array<ClubSchemaWizardItem>} items
     */
    function validateLoadItems(items) {
        if (Array.isArray(items) === false) {
            throw new Error('ClubSchemaWizard: Items should be array of objects with non-empty string fields: id, title, type');
        }

        let itemIdValidator = new Set();

        for (let item of items) {
            if (
                typeof item !== 'object'
                || item === null
                || typeof item.id !== 'string'
                || item.id.length === 0
                || typeof item.title !== 'string'
                || item.title.length === 0
                || typeof item.type !== 'string'
                || item.type.length === 0
            ) {
                throw new Error('ClubSchemaWizard: Items should be array of objects with non-empty string fields: id, title, type');
            }

            if (itemIdValidator.has(item.id)) {
                throw new Error(`ClubSchemaWizard: Items should contain objects with unique id, got duplicate: "${item.id}"`);
            }

            itemIdValidator.add(item.id);
        }
    }

    /**
     @param {ClubSchemaWizardSchema} schema
     */
    function validateLoadSchema(schema) {
        if (
            typeof schema !== 'object'
            || schema === null
            || Array.isArray(schema.info) === false
            || Array.isArray(schema.items) === false
        ) {
            throw new Error('ClubSchemaWizard: Schema should be object array fields: info, items');
        }

        let itemIdValidator = new Set();

        for (let item of schema.items) {
            if (
                typeof item !== 'object'
                || item === null
                || typeof item.id !== 'string'
                || item.id.length === 0
                || typeof item.title !== 'string'
                || item.title.length === 0
                || typeof item.type !== 'string'
                || item.type.length === 0
                || typeof item.top !== 'number'
                || typeof item.left !== 'number'
            ) {
                throw new Error('ClubSchemaWizard: Items should be array of objects with non-empty string fields: id, title, type, top, left, color');
            }

            if (itemIdValidator.has(item.id)) {
                throw new Error(`ClubSchemaWizard: Items should contain objects with unique id, got duplicate: "${item.id}"`);
            }

            itemIdValidator.add(item.id);
        }

        for (let info of schema.info) {
            if (
                typeof info !== 'object'
                || info === null
                || typeof info.text !== 'string'
                || info.text.length === 0
                || typeof info.type !== 'string'
                || ['text', 'admin'].includes(info.type) === false
                || typeof info.color !== 'string'
                || info.color.length === 0
                || typeof info.top !== 'number'
                || typeof info.left !== 'number'
            ) {
                throw new Error('ClubSchemaWizard: Info should be array of objects with numeric fields: top, left and with non-empty string fields: text, type, color');
            }
        }
    }

    /**
     * @returns {Promise<string>}
     */
    function getInfoTextWithPrompt() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                let text = prompt('Введите текст');

                if (text) {
                    resolve(text.replace(/\\n/g, '\n').trim());
                } else {
                    reject();
                }
            }, 50);
        });
    }

    /**
     * @param {string} html
     * @returns {string}
     */
    function htmlEncode(html) {
        return html
            .replace(/&/g, '&amp;')
            .replace(/>/g, '&gt;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * @param {string} type
     * @returns {string}
     */
    function generateInfoId(type) {
        return (`info-${type}-${Math.random()}`).replace('.', '');
    }

    /**
     * Mock function without any operations
     */
    function noop() {
        // do nothing
    }

    return ClubSchemaWizard;
})();

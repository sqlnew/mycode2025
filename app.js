(function ($) {
    const STORAGE_KEYS = { icons: 'light_desktop_icons_final2', windows: 'light_desktop_windows_final2', taskOrder: 'light_desktop_taskorder_final2' };
    let zIndexCounter = 20;
    let winCounter = 0;
    const $windows = $('#windows'), $taskCenter = $('#taskCenter'), $iconsContainer = $('#iconsContainer');
    const $preview = $('#previewCard'), $previewInner = $preview.find('.inner');
    const $desktopMenu = $('#desktopMenu');
    const $quickBtn = $('#quickBtn'), $quickMenu = $('#quickMenu');
    const $titlebarMenu = $('#titlebarMenu');
    const $startClassic = $('#startClassic');
    const $startClassicRoot = $('#startClassicRoot');
    const $pageLeftBtn = $('#taskPageLeft');
    const $pageRightBtn = $('#taskPageRight');
    const $taskTooltip = $('#taskTooltip');
    const $taskTooltipTitle = $('#taskTooltipTitle');
    let tooltipTimer = null;
    let currentTooltipFor = null;
    const MIN_VISIBLE_WIDTH = 64;
    const TASKBAR_HEIGHT = 32;
    // 保持与 CSS 一致
    const defaultIcons = [
        { id: 'explorer', label: '文件资源管理器', img: './icons/explorer.png', x: 20, y: 20 },
        { id: 'browser', label: '浏览器', img: './icons/browser.png', x: 20, y: 120 },
        { id: 'notes', label: '便笺', img: './icons/notes.png', x: 20, y: 220 },
        { id: 'media', label: '媒体播放器', img: './icons/media.png', x: 20, y: 320 },
        { id: 'webpanel', label: '网页面板', img: './icons/webpanel.png', x: 120, y: 20 }
    ];
    const appTemplates = {
        explorer: { title: '文件资源管理器', icon: 'E', content: '<h3>文件资源管理器</h3><p>示例文件管理器。</p>' },
        browser: { title: '浏览器', icon: 'B', content: '<h3>浏览器</h3><p>示例网页窗口。</p>' },
        notes: { title: '便笺', icon: 'N', content: '<textarea style="width:100%;height:180px;background:#fbfdff;border-radius:6px;border:1px solid rgba(0,0,0,0.04);color:var(--text);padding:8px;" placeholder="在这里写你的便笺"></textarea>' },
        media: { title: '媒体播放器', icon: 'M', content: '<h3>媒体播放器</h3><p>媒体占位。</p>' },
        store: { title: '商店', icon: 'S', content: '<h3>商店</h3><p>商店占位。</p>' },
        settings: { title: '设置', icon: '⚙', content: '<h3>设置</h3><p>设置占位。</p>' },
        webpanel: {
            title: '网页面板', icon: 'W', content: `
 <div style="height:100%;display:flex;flex-direction:column;">
 <div class="webpanel-top">
 <input id="webpanelUrl" placeholder="输入网址或相对路径，例如 /page.html 或 /app/index.html" />
 <button id="webpanelGo">打开</button>
 </div>
 <div style="flex:1;border:1px solid var(--border);border-radius:8px;overflow:hidden;">
 <iframe id="webpanelFrame" src="about:blank" style="width:100%;height:100%;border:0;"></iframe>
 </div>
 </div>
 ` }
    };
    // 小辅助：根据 appId 从默认桌面图标中解析对应的图标文件路径
    function resolveAppIcon(appId) {
        if (!appId) return null;
        try {
            const ic = (Array.isArray(defaultIcons) ? defaultIcons : []).find(d => d && d.id === appId);
            return ic && ic.img ? ic.img : null;
        } catch (e) { return null; }
    }
    function saveIconsState(icons) { localStorage.setItem(STORAGE_KEYS.icons, JSON.stringify(icons)); }
    function loadIconsState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.icons) || 'null') || defaultIcons; } catch (e) { return defaultIcons; } }
    function saveWindowsState(wins) { localStorage.setItem(STORAGE_KEYS.windows, JSON.stringify(wins)); }
    function loadWindowsState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.windows) || 'null') || []; } catch (e) { return []; } }
    function saveTaskOrder(order) { localStorage.setItem(STORAGE_KEYS.taskOrder, JSON.stringify(order)); }
    function loadTaskOrder() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.taskOrder) || 'null') || []; } catch (e) { return []; } }
    // 裁剪透明边函数（保持原有实现）
    function trimTransparentBorder(imgSrc, maxSize = 128, cb) { const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = function () { const w = img.naturalWidth, h = img.naturalHeight; const sampleCanvas = document.createElement('canvas'); const sampleScale = Math.max(1, Math.ceil(Math.max(w, h) / maxSize)); sampleCanvas.width = Math.ceil(w / sampleScale); sampleCanvas.height = Math.ceil(h / sampleScale); const sctx = sampleCanvas.getContext('2d'); sctx.drawImage(img, 0, 0, sampleCanvas.width, sampleCanvas.height); const data = sctx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data; let minX = sampleCanvas.width, minY = sampleCanvas.height, maxX = 0, maxY = 0, found = false; for (let y = 0; y < sampleCanvas.height; y++) { for (let x = 0; x < sampleCanvas.width; x++) { const i = (y * sampleCanvas.width + x) * 4; if (data[i + 3] > 8) { found = true; if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; } } } if (!found) { cb(imgSrc); return; } const pad = Math.max(1, Math.round(2 * sampleScale)); const sx = Math.max(0, Math.floor(minX * sampleScale) - pad); const sy = Math.max(0, Math.floor(minY * sampleScale) - pad); const ex = Math.min(w, Math.ceil((maxX + 1) * sampleScale) + pad); const ey = Math.min(h, Math.ceil((maxY + 1) * sampleScale) + pad); const sw = ex - sx, sh = ey - sy; const outCanvas = document.createElement('canvas'); outCanvas.width = sw; outCanvas.height = sh; const outCtx = outCanvas.getContext('2d'); outCtx.clearRect(0, 0, sw, sh); outCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh); try { const dataUrl = outCanvas.toDataURL('image/png'); cb(dataUrl); } catch (e) { cb(imgSrc); } }; img.onerror = function () { cb(imgSrc); }; img.src = imgSrc; }
    // 简单缓存
    const _trimCache = new Map();
    function trimTransparentBorderCached(src, maxSize, cb) {
        if (!src) { cb(src); return; }
        if (_trimCache.has(src)) { cb(_trimCache.get(src)); return; }
        const run = () => { trimTransparentBorder(src, maxSize, function (res) { try { _trimCache.set(src, res); } catch (e) { } cb(res); }); };
        if ('requestIdleCallback' in window) { requestIdleCallback(run, { timeout: 500 }); } else { setTimeout(run, 50); }
    }
    function renderIcons() {
        $iconsContainer.empty();
        const icons = loadIconsState();
        icons.forEach(ic => {
            const $d = $(`<div class="desk-icon" data-id="${ic.id}" tabindex="0"> <div class="ico">${ic.img ? `<img src="${ic.img}" alt="${ic.label}">` : (ic.icon ? ic.icon : 'A')}</div> <div class="label">${ic.label}</div> </div>`).css({ position: 'absolute', left: ic.x + 'px', top: ic.y + 'px' });
            $iconsContainer.append($d);
            $d.on('dblclick', () => openApp(ic.id));
            // 保留并增强：桌面图标选中逻辑（单选/多选支持 Ctrl）
            $d.on('click', function (e) {
                e.stopPropagation();
                const isCtrl = e.ctrlKey || e.metaKey;
                if (!isCtrl) {
                    // 清除其他选中
                    $iconsContainer.find('.desk-icon.selected').not(this).removeClass('selected');
                }
                $(this).toggleClass('selected');
            });
            // 键盘支持：Enter 打开，Space 切换选中
            $d.on('keydown', function (e) {
                if (e.key === 'Enter') { openApp(ic.id); }
                else if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); $(this).toggleClass('selected'); }
            });
            if (ic.img) {
                const $img = $d.find('img');
                trimTransparentBorderCached(ic.img, 160, function (resultSrc) {
                    if ($img && $img.length) {
                        $img.attr('src', resultSrc);
                        const tmp = new Image();
                        tmp.onload = function () {
                            const rw = tmp.naturalWidth, rh = tmp.naturalHeight;
                            if (rw === 0 || rh === 0) return;
                            if (rh > rw) { $img.css({ height: '56px', width: 'auto' }); } else { $img.css({ width: '56px', height: 'auto' }); }
                        };
                        tmp.src = resultSrc;
                    }
                });
            }
        });
        interact('.desk-icon').draggable({
            inertia: true,
            cursorChecker: () => 'default',
            listeners: {
                start(event) { $(event.target).addClass('dragging'); event.target.style.cursor = 'crosshair'; },
                move(event) {
                    const target = event.target;
                    const dx = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    const dy = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                    target.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
                    target.setAttribute('data-x', dx);
                    target.setAttribute('data-y', dy);
                },
                end(event) {
                    const t = event.target; $(t).removeClass('dragging'); t.style.cursor = 'default';
                    const dx = parseFloat(t.getAttribute('data-x')) || 0; const dy = parseFloat(t.getAttribute('data-y')) || 0;
                    const left = Math.round((parseFloat($(t).css('left')) || 0) + dx);
                    const top = Math.round((parseFloat($(t).css('top')) || 0) + dy);
                    t.style.transform = ''; t.removeAttribute('data-x'); t.removeAttribute('data-y');
                    $(t).css({ left: left + 'px', top: top + 'px' });
                    const id = $(t).data('id'); const icons = loadIconsState(); const idx = icons.findIndex(it => it.id === id);
                    if (idx >= 0) { icons[idx].x = left; icons[idx].y = top; saveIconsState(icons); }
                }
            }
        });
    }
    const windowsMap = {};
    function normalStateSVG() { return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"> <rect x="7.5" y="0.5" width="16" height="16" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.5"></rect> <rect x="1.5" y="6.5" width="16" height="16" rx="1.4" fill="#ffffff" stroke="currentColor" stroke-width="1.5"></rect> </svg>`; }
    function maximizeStateSVG() { return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="24" viewBox="0 0 32 24" role="img" aria-label="restore icon"> <rect x="0.5" y="1" width="31" height="22" rx="3" ry="3" fill="none" stroke="currentColor" stroke-width="1.6" vector-effect="non-scaling-stroke" /> </svg>`; }
    function minIconSVG() { return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"> <path d="M5 12.5h14" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"></path> </svg>`; }
    function closeIconSVG() { return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"> <path d="M4.17157288 4.17157288 L19.82842712 19.82842712 M19.82842712 4.17157288 L4.17157288 19.82842712" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/> </svg>`; }
    function updateMaxIcon(id) { const meta = windowsMap[id]; if (!meta || !meta.$el) return; const $btn = meta.$el.find('.btn-max'); if (meta.maximized) { $btn.html(normalStateSVG()); $btn.attr('title', '还原'); } else { $btn.html(maximizeStateSVG()); $btn.attr('title', '最大化'); } }
    function clampToViewport(left, top, width, height) { const vw = window.innerWidth, vh = window.innerHeight; const minLeft = -(width - MIN_VISIBLE_WIDTH); const maxLeft = vw - MIN_VISIBLE_WIDTH; left = Math.min(maxLeft, Math.max(minLeft, left)); const minTop = 0; const maxTop = Math.max(0, vh - height - 8 - TASKBAR_HEIGHT); top = Math.min(maxTop, Math.max(minTop, top)); return { left, top }; }
    function createWindow(options, restoreId) {
        const id = restoreId || ('win_' + (++winCounter) + '_' + Date.now());
        const meta = { id, app: options.app || 'app', title: options.title || ('窗口 ' + id), content: options.content || '', x: options.x || (80 + (winCounter * 24) % 220), y: options.y || (options.y === 0 ? 0 : (60 + (winCounter * 18) % 140)), width: options.width || 720, height: options.height || 460, minimized: !!options.minimized, maximized: !!options.maximized, prevRect: null };
        // 计算标题栏图标来源：优先使用 options.img，其次根据 appId 解析，再使用默认图标
        const titleIconSrc = options.img || resolveAppIcon(options.app) || './icons/defaultfolder.png';
        const $win = $(`<div class="win" id="${id}"> <div class="titlebar"> <div class="title-icon"><img src="${titleIconSrc}" alt="${meta.title}"></div> <div class="title">${meta.title}</div> <div class="actions"> <div class="btn btn-min" title="最小化">${minIconSVG()}</div> <div class="btn btn-max" title="最大化">${meta.maximized ? normalStateSVG() : maximizeStateSVG()}</div> <div class="btn btn-close" title="关闭">${closeIconSVG()}</div> </div> </div> <div class="content">${meta.content}</div> </div>`).css({ left: meta.x + 'px', top: meta.y + 'px', width: meta.width + 'px', height: meta.height + 'px' });
        $windows.append($win);
        windowsMap[id] = meta;
        meta.$el = $win;
        // 传入 app id 以便生成稳定颜色 addTaskIcon 中会优先使用图片
        addTaskIcon(id, meta.title, options.icon || (options.app ? appTemplates[options.app]?.icon || options.app[0].toUpperCase() : 'W'), options.img || resolveAppIcon(options.app) || './icons/defaultfolder.png', options.app);
        $win.find('.btn-close').on('click', () => closeWindow(id));
        $win.find('.btn-min').on('click', () => minimizeWindow(id));
        $win.find('.btn-max').on('click', () => toggleMaximize(id));
        $win.on('mousedown', function () { bringToFront(id); });
        // 当窗口在最大化状态时，点击标题栏会把任务栏提升到该窗口之上（保留原注释与逻辑）
        (function installTitlebarRaiseTaskbar() {
            const $titlebar = $win.find('.titlebar');
            function raiseTaskbarIfMaximized(evt) {
                const m = windowsMap[id];
                if (!m || !m.maximized) return;
                try {
                    const winZ = parseInt(meta.$el.css('z-index') || 9999, 10) || 9999;
                    $('#taskbar').css('z-index', winZ + 2);
                    $(document).one('mousedown.raiseTaskbar', function () { setTimeout(function () { $('#taskbar').css('z-index', 60); }, 50); });
                } catch (e) { }
            }
            $titlebar.on('click', raiseTaskbarIfMaximized);
            $titlebar.on('contextmenu', raiseTaskbarIfMaximized);
        })();
        interact($win[0]).draggable({
            allowFrom: '.titlebar',
            listeners: {
                start() { bringToFront(id); },
                move(event) {
                    if (meta.maximized) return;
                    let newX = meta.x + event.dx;
                    let newY = meta.y + event.dy;
                    newY = Math.max(0, newY);
                    const minLeft = -(meta.width - MIN_VISIBLE_WIDTH);
                    const maxLeft = window.innerWidth - MIN_VISIBLE_WIDTH;
                    newX = Math.min(maxLeft, Math.max(minLeft, newX));
                    meta.x = newX; meta.y = newY;
                    meta.$el.css({ left: meta.x + 'px', top: meta.y + 'px' });
                },
                end() { persistWindows(); }
            },
            inertia: true
        }).resizable({
            edges: { left: true, right: true, bottom: true, top: true },
            /* 将边缘检测区域缩小为 6px，减少在标题栏上方误触发“上沿调整大小”的概率。
               如果你想更严格优先拖动，可把 6 改为 4 或 2；若想更灵敏则增大该值。 */
            margin: 6,
            modifiers: [interact.modifiers.restrictSize({ min: { width: 260, height: 140 } })],
            listeners: {
                move(event) {
                    let { x, y } = meta;
                    meta.width = Math.max(260, event.rect.width);
                    meta.height = Math.max(140, event.rect.height);
                    x += event.deltaRect.left; y += event.deltaRect.top;
                    y = Math.max(0, y);
                    const minLeft = -(meta.width - MIN_VISIBLE_WIDTH);
                    const maxLeft = window.innerWidth - MIN_VISIBLE_WIDTH;
                    x = Math.min(maxLeft, Math.max(minLeft, x));
                    meta.x = x; meta.y = y;
                    meta.$el.css({ width: meta.width + 'px', height: meta.height + 'px', left: meta.x + 'px', top: meta.y + 'px' });
                },
                end() { persistWindows(); }
            },
            inertia: true
        });
        if (meta.maximized) { applyMaxOver(id, true); }
        bringToFront(id);
        persistWindows();
        if (options.app === 'webpanel' && meta.$el) { initWebPanel(meta.$el); }
        updateMaxIcon(id);
        return id;
    }
    function initWebPanel($win) {
        const $input = $win.find('#webpanelUrl');
        const $btn = $win.find('#webpanelGo');
        const $frame = $win.find('#webpanelFrame');
        $btn.on('click', function () { const url = ($input.val() || '').trim(); $frame.attr('src', url); });
        $input.on('keydown', function (e) { if (e.key === 'Enter') { $btn.trigger('click'); } });
    }
    function bringToFront(id) {
        $('.win').removeClass('focus');
        const meta = windowsMap[id];
        if (!meta) return;
        meta.$el.addClass('focus');
        meta.$el.css('z-index', ++zIndexCounter);
        const base = 12;
        const extra = Math.min(40, Math.floor((zIndexCounter - 20) / 2));
        const elev = base + extra;
        meta.$el.css('--elev', elev);
        $('.win').not(meta.$el).each(function (i, el) { const $el = $(el); $el.css('--elev', Math.max(8, elev - 6)); });
        $taskCenter.find('.task-icon').removeClass('active');
        $taskCenter.find(`[data-win="${id}"]`).addClass('active');
        const t = $taskCenter.find(`[data-win="${id}"]`);
        if (t.length) { t.find('.t-title').text(meta.title || ''); }
        requestAnimationFrame(() => updateTaskPagingControls());
    }
    function closeWindow(id) {
        const meta = windowsMap[id];
        if (!meta) return;
        $taskCenter.find(`[data-win="${id}"]`).remove();
        meta.$el.remove();
        delete windowsMap[id];
        persistWindows();
        persistTaskOrder();
        adjustTaskIconWidths();
        updateTaskPagingControls();
        if (currentTooltipFor === id) { hideTaskTooltip(); }
    }
    function minimizeWindow(id) {
        const meta = windowsMap[id];
        if (!meta || !meta.$el) return;
        const $task = $taskCenter.find(`[data-win="${id}"]`);
        let rectWin;
        if (meta.maximized && meta.prevRect) { rectWin = { left: meta.prevRect.left, top: meta.prevRect.top, width: meta.prevRect.width, height: meta.prevRect.height }; }
        else { rectWin = meta.$el[0].getBoundingClientRect(); }
        const rectTask = $task.length ? $task[0].getBoundingClientRect() : { left: rectWin.left + rectWin.width / 2 - 30, top: rectWin.top + rectWin.height / 2 - 12, width: 60, height: 24 };
        const $ghost = $('<div class="ghost"></div>').css({ left: rectWin.left + 'px', top: rectWin.top + 'px', width: rectWin.width + 'px', height: rectWin.height + 'px' }).appendTo('body');
        meta.$el.addClass('hidden');
        const startCx = rectWin.left + rectWin.width / 2, startCy = rectWin.top + rectWin.height / 2;
        const endCx = rectTask.left + rectTask.width / 2, endCy = rectTask.top + rectTask.height / 2;
        const translateX = endCx - startCx, translateY = endCy - startCy;
        const scaleX = Math.max(0.12, rectTask.width / rectWin.width);
        const scaleY = Math.max(0.08, rectTask.height / rectWin.height);
        requestAnimationFrame(() => { $ghost.css({ transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`, opacity: 0.95 }); });
        setTimeout(() => { $ghost.remove(); meta.minimized = true; meta.$el.hide().removeClass('hidden'); persistWindows(); }, 360);
    }
    /**
     * createIframeWindow
     * 在桌面上新建一个窗口，内容为 iframe 并加载本站点页面（增强版）。
     *
     * 参数：
     *  - pageUrl {string}  : 要打开的页面地址（建议使用本站相对路径或同源绝对路径）
     *  - title   {string}  : 窗口标题（显示在标题栏）
     *  - iconSrc {string}  : 标题栏与任务栏使用的图标地址（可选）
     *
     * 返回：
     *  - { id, iframeEl, loaded }
     *    - id: 新建窗口的 id（字符串）
     *    - iframeEl: 创建的 iframe DOM 元素引用
     *    - loaded: Promise，在 iframe load 事件触发后 resolve(iframeEl)
     *
     * 说明：
     *  - 为了安全与一致性，函数会尽量确保 pageUrl 为本站点路径（以 '/' 开头或与 location.origin 同源）。
     *  - iframe 使用 sandbox 属性以限制权限；在同源场景下允许脚本与表单（可按需调整）。
     *  - 函数会在 iframe 加载完成时更新加载指示并 resolve 返回的 Promise。
     */
    function createIframeWindow(pageUrl, title, iconSrc) {
        // 参数与同源校验
        let finalUrl = 'about:blank';
        try {
            if (!pageUrl || typeof pageUrl !== 'string') {
                console.warn('createIframeWindow: invalid pageUrl, falling back to about:blank');
                finalUrl = 'about:blank';
            } else {
                // 允许相对路径或同源绝对路径
                try {
                    const parsed = new URL(pageUrl, window.location.href);
                    if (parsed.origin !== window.location.origin) {
                        // 非本站点地址，警告并回退到 about:blank（可按需放宽）
                        console.warn('createIframeWindow: pageUrl is not same-origin, falling back to about:blank', pageUrl);
                        finalUrl = 'about:blank';
                    } else {
                        finalUrl = parsed.href;
                    }
                } catch (e) {
                    console.warn('createIframeWindow: URL parse failed, falling back to about:blank', e);
                    finalUrl = 'about:blank';
                }
            }
        } catch (err) {
            console.warn('createIframeWindow: unexpected error during validation', err);
            finalUrl = 'about:blank';
        }

        // 生成唯一 iframe id 以便后续引用
        const iframeId = 'iframe_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

        // 构造加载指示（简单条与文字），并在 iframe 加载完成后隐藏
        const loadingBarHtml = `
    <div class="iframe-loading" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid rgba(11,23,40,0.04);background:linear-gradient(180deg,#fff,#fbfdff);">
      <div style="width:12px;height:12px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px rgba(11,132,255,0.18);animation:iframePulse 1.2s infinite linear;"></div>
      <div style="font-size:13px;color:var(--muted);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">正在加载：${(title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      <div style="font-size:12px;color:var(--muted);opacity:0.8;">${finalUrl === 'about:blank' ? 'about:blank' : new URL(finalUrl).pathname}</div>
    </div>
    <style>
      @keyframes iframePulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.86); opacity: 0.6; } 100% { transform: scale(1); opacity: 1; } }
    </style>
  `;

        // iframe HTML（使用 sandbox，允许同源脚本与表单）
        // sandbox 属性：在同源场景下 allow-same-origin 允许 iframe 与父窗口同源交互（谨慎使用）
        const iframeHtml = `
    <div style="height:100%;display:flex;flex-direction:column;">
      ${loadingBarHtml}
      <div style="flex:1;border:0;overflow:hidden;">
        <iframe id="${iframeId}" src="${finalUrl}" style="width:100%;height:100%;border:0;" sandbox="allow-same-origin allow-scripts allow-forms"></iframe>
      </div>
    </div>
  `;

        // 使用现有 createWindow 创建窗口（保留原有行为）
        const winId = createWindow({
            app: 'iframe-window',
            title: title || finalUrl,
            content: iframeHtml,
            img: iconSrc || undefined,
            width: 900,
            height: 600
        });

        // 获取 iframe 元素引用（可能需要等待 DOM 插入）
        const meta = windowsMap[winId];
        let iframeEl = null;
        let loadedResolve;
        const loadedPromise = new Promise((resolve) => { loadedResolve = resolve; });

        // 尝试在下一帧获取 iframe 元素并绑定 load 事件
        requestAnimationFrame(() => {
            try {
                if (meta && meta.$el && meta.$el.length) {
                    iframeEl = meta.$el.find('#' + iframeId)[0];
                    if (iframeEl) {
                        // 绑定 load 事件：在加载完成后隐藏加载指示并 resolve
                        const onLoadHandler = function () {
                            try {
                                // 隐藏或移除加载条（查找父容器的第一个子节点）
                                const $loading = meta.$el.find('.iframe-loading');
                                if ($loading && $loading.length) {
                                    $loading.fadeOut(160, function () { $loading.remove(); });
                                }
                            } catch (e) { /* 忽略隐藏失败 */ }
                            // resolve 返回 iframe 元素
                            try { loadedResolve(iframeEl); } catch (e) { }
                            // 移除事件监听（防止重复触发）
                            try { iframeEl.removeEventListener('load', onLoadHandler); } catch (e) { }
                        };
                        // 如果 iframe 已经完成加载（缓存/同步），直接触发处理
                        iframeEl.addEventListener('load', onLoadHandler);
                        // 若 iframe 已经处于 complete 状态（某些浏览器场景），手动触发一次
                        try {
                            if (iframeEl.contentWindow && iframeEl.contentDocument && iframeEl.contentDocument.readyState === 'complete') {
                                // 延迟执行以保证 onLoadHandler 已绑定
                                setTimeout(() => { onLoadHandler(); }, 20);
                            }
                        } catch (e) {
                            // 访问 contentDocument 可能因跨域被拒绝；在同源场景下上面会工作
                        }
                    } else {
                        // 未找到 iframe 元素（极少见），直接 resolve null 并在控制台警告
                        console.warn('createIframeWindow: iframe element not found after createWindow', iframeId, winId);
                        loadedResolve(null);
                    }
                } else {
                    console.warn('createIframeWindow: window meta not found for', winId);
                    loadedResolve(null);
                }
            } catch (err) {
                console.warn('createIframeWindow: unexpected error while binding iframe load', err);
                loadedResolve(null);
            }
        });

        // 返回包含 id、iframe 元素引用（可能为 null，需等待 loaded Promise）与 loaded Promise
        return { id: winId, iframeEl: iframeEl, loaded: loadedPromise };
    }
    window.createIframeWindow = createIframeWindow;

    function restoreFromTask(id) {
        const meta = windowsMap[id];
        const $task = $taskCenter.find(`[data-win="${id}"]`);
        if (!meta || !$task.length) return;
        let finalLeft = (meta.prevRect && meta.maximized) ? meta.prevRect.left : (typeof meta.x === 'number' ? meta.x : 80);
        let finalTop = (meta.prevRect && meta.maximized) ? meta.prevRect.top : (typeof meta.y === 'number' ? meta.y : 60);
        const finalW = (meta.prevRect && meta.maximized) ? meta.prevRect.width : (meta.width || 720);
        const finalH = (meta.prevRect && meta.maximized) ? meta.prevRect.height : (meta.height || 460);
        const clamped = clampToViewport(finalLeft, finalTop, finalW, finalH);
        finalLeft = clamped.left; finalTop = clamped.top;
        const willMaximize = meta.prevRect && meta.maximized;
        meta.minimized = false;
        if (willMaximize && meta.prevRect) {
            meta.$el.addClass('maxed-over').css({ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 9999, visibility: 'visible' }).show();
            meta.maximized = true;
        } else {
            meta.$el.removeClass('maxed-over').css({ position: 'absolute', left: finalLeft + 'px', top: finalTop + 'px', width: finalW + 'px', height: finalH + 'px', visibility: 'visible' }).show();
            meta.x = finalLeft; meta.y = finalTop; meta.width = finalW; meta.height = finalH; meta.maximized = false;
        }
        bringToFront(id);
        persistWindows();
    }
    function applyMaxOver(id, forceApply) {
        const meta = windowsMap[id];
        if (!meta) return;
        if (!forceApply && meta.maximized) {
            meta.maximized = false;
            if (meta.prevRect) {
                meta.$el.removeClass('maxed-over');
                meta.$el.css({ position: 'absolute', left: meta.prevRect.left + 'px', top: meta.prevRect.top + 'px', width: meta.prevRect.width + 'px', height: meta.prevRect.height + 'px' });
                meta.x = meta.prevRect.left; meta.y = meta.prevRect.top; meta.width = meta.prevRect.width; meta.height = meta.prevRect.height; meta.prevRect = null;
            } else {
                meta.$el.removeClass('maxed-over');
                meta.$el.css({ position: 'absolute', left: meta.x + 'px', top: meta.y + 'px', width: meta.width + 'px', height: meta.height + 'px' });
            }
            updateMaxIcon(id); persistWindows(); return;
        }
        const rect = meta.$el[0].getBoundingClientRect();
        meta.prevRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        meta.maximized = true;
        meta.$el.addClass('maxed-over').css({ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 9999, visibility: 'visible' });
        updateMaxIcon(id); persistWindows();
    }
    function toggleMaximize(id) { const meta = windowsMap[id]; if (!meta) return; if (meta.maximized) applyMaxOver(id, false); else applyMaxOver(id, true); }
    // 生成柔和背景色
    function stringToPastelColor(str) { let h = 0; for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; } const hue = Math.abs(h) % 360; const sat = 62; const light = 62; return `hsl(${hue} ${sat}% ${light}%)`; }
    // --- 根据可用宽度自适应任务栏项宽度 ---
    function adjustTaskIconWidths() {
        const $items = $taskCenter.children('.task-icon');
        const count = $items.length;
        if (count === 0) return;
        const gap = 8;
        const paddingLR = 6 + 6;
        const internalGaps = (count - 1) * gap;
        const available = Math.max(80, $taskCenter.width() - paddingLR - internalGaps);
        const minWidth = 80;
        const maxCap = Math.min(360, Math.floor(available * 0.6));
        const target = Math.floor(available / count);
        let finalWidth = Math.max(minWidth, target);
        finalWidth = Math.min(finalWidth, Math.max(minWidth, maxCap));
        if (finalWidth * count <= available + 1) {
            $items.each(function () { $(this).css({ width: finalWidth + 'px' }); });
            $items.find('.t-title').css({ maxWidth: (finalWidth - 36 - 12) + 'px' });
        } else {
            $items.each(function () { $(this).css({ width: minWidth + 'px' }); });
            $items.find('.t-title').css({ maxWidth: (minWidth - 36 - 12) + 'px' });
        }
        updateTaskPagingControls();
    }
    // 计算并显示/隐藏分页按钮
    function updateTaskPagingControls() {
        const container = $taskCenter[0];
        if (!container) return;
        const overflow = container.scrollWidth > container.clientWidth + 2;
        if (overflow) {
            const maxScroll = container.scrollWidth - container.clientWidth;
            const atLeft = container.scrollLeft <= 2;
            const atRight = container.scrollLeft >= maxScroll - 2;
            $pageLeftBtn.removeClass('hidden').attr('aria-hidden', 'false');
            $pageRightBtn.removeClass('hidden').attr('aria-hidden', 'false');
            if (atLeft) { $pageLeftBtn.addClass('disabled').attr('aria-disabled', 'true').attr('title', '已经在最左页'); } else { $pageLeftBtn.removeClass('disabled').attr('aria-disabled', 'false').attr('title', '上一页'); }
            if (atRight) { $pageRightBtn.addClass('disabled').attr('aria-disabled', 'true').attr('title', '已经在最右页'); } else { $pageRightBtn.removeClass('disabled').attr('aria-disabled', 'false').attr('title', '下一页'); }
        } else {
            $pageLeftBtn.addClass('hidden').attr('aria-hidden', 'true').removeClass('disabled').attr('aria-disabled', 'false');
            $pageRightBtn.addClass('hidden').attr('aria-hidden', 'true').removeClass('disabled').attr('aria-disabled', 'false');
            $taskCenter.stop(true).animate({ scrollLeft: 0 }, 160);
        }
    }
    function pageTaskbarRight() {
        const container = $taskCenter[0];
        if (!container) return;
        const pageWidth = container.clientWidth - 8;
        const target = Math.min(container.scrollLeft + pageWidth, container.scrollWidth - container.clientWidth);
        $taskCenter.stop(true).animate({ scrollLeft: Math.round(target) }, 260, function () { updateTaskPagingControls(); });
    }
    function pageTaskbarLeft() {
        const container = $taskCenter[0];
        if (!container) return;
        const pageWidth = container.clientWidth - 8;
        const target = Math.max(container.scrollLeft - pageWidth, 0);
        $taskCenter.stop(true).animate({ scrollLeft: Math.round(target) }, 260, function () { updateTaskPagingControls(); });
    }
    let resizeTimer;
    $(window).on('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { adjustTaskIconWidths(); hideTaskTooltip(); }, 80); });
    $taskCenter.on('scroll', function () { if (this._pageScrollTimer) clearTimeout(this._pageScrollTimer); this._pageScrollTimer = setTimeout(() => { updateTaskPagingControls(); hideTaskTooltip(); }, 80); });
    $pageRightBtn.on('click', function (e) { e.stopPropagation(); if ($(this).hasClass('disabled')) return; pageTaskbarRight(); });
    $pageLeftBtn.on('click', function (e) { e.stopPropagation(); if ($(this).hasClass('disabled')) return; pageTaskbarLeft(); });
    // --- 任务栏拖拽重排相关工具函数 ---
    function createTaskPlaceholder(width) { const $ph = $('<div class="task-placeholder" aria-hidden="true"></div>'); if (width && typeof width === 'number') { $ph.css({ width: width + 'px' }); } return $ph; }
    function insertAtIndex($parent, $el, index) { const children = $parent.children().not('.task-placeholder'); if (index >= children.length) { $parent.append($el); } else { $(children.get(index)).before($el); } }
    // 生成任务栏项
    function addTaskIcon(winId, title, iconChar, img, appId) {
        if ($taskCenter.find(`[data-win="${winId}"]`).length) return;
        const baseKey = appId || title || (iconChar ? iconChar.toString() : winId);
        const bgColor = stringToPastelColor(baseKey);
        const iconSrc = img || resolveAppIcon(appId) || './icons/defaultfolder.png';
        const ticonHtml = `<div class="t-ico" style="background:transparent;"><img src="${iconSrc}" alt="${title}"></div>`;
        const $ti = $(`<div class="task-icon" data-win="${winId}" tabindex="0" role="button" aria-label="${title}">${ticonHtml}<div class="t-title">${title}</div></div>`);
        const order = loadTaskOrder();
        if (order.length) {
            const idx = order.indexOf(winId);
            if (idx === -1) { $taskCenter.append($ti); order.push(winId); saveTaskOrder(order); }
            else { const children = $taskCenter.children(); if (idx >= children.length) $taskCenter.append($ti); else $(children[idx]).before($ti); }
        } else { $taskCenter.append($ti); saveTaskOrder(Array.from($taskCenter.children()).map(x => $(x).data('win'))); }
        $ti.on('click', function () {
            const id = $(this).data('win'); const meta = windowsMap[id];
            if (!meta) return;
            if (meta.minimized) restoreFromTask(id);
            else { if (meta.$el.hasClass('focus')) minimizeWindow(id); else bringToFront(id); }
        });
        function showTaskTooltipFor(el) {
            const id = $(el).data('win'); const meta = windowsMap[id]; if (!meta) return;
            currentTooltipFor = id; $taskTooltipTitle.text(meta.title || '');
            $taskTooltip.attr('aria-hidden', 'false');
            const rect = el.getBoundingClientRect();
            requestAnimationFrame(() => {
                $taskTooltip.css({ left: (rect.left + rect.width / 2) + 'px', top: (rect.top - 8 - ($taskTooltip.outerHeight() || 40)) + 'px', transform: 'translateX(-50%)', display: 'block' });
                $taskTooltip.addClass('show');
            });
        }
        function hideTaskTooltip() {
            if (tooltipTimer) { clearTimeout(tooltipTimer); tooltipTimer = null; }
            currentTooltipFor = null;
            $taskTooltip.removeClass('show').attr('aria-hidden', 'true');
            setTimeout(() => { if (!$taskTooltip.hasClass('show')) $taskTooltip.hide(); }, 180);
        }
        $ti.on('mouseenter', function () { const el = this; if (tooltipTimer) clearTimeout(tooltipTimer); tooltipTimer = setTimeout(() => { showTaskTooltipFor(el); tooltipTimer = null; }, 320); });
        $ti.on('mouseleave', function () { if (tooltipTimer) { clearTimeout(tooltipTimer); tooltipTimer = null; } setTimeout(() => { if (!$(document.activeElement).is('.task-icon') || $(document.activeElement).data('win') !== $(this).data('win')) { hideTaskTooltip(); } }, 120); });
        $ti.on('focus', function () { if (tooltipTimer) { clearTimeout(tooltipTimer); tooltipTimer = null; } showTaskTooltipFor(this); });
        $ti.on('blur', function () { hideTaskTooltip(); });
        $ti.on('remove', function () { if (currentTooltipFor === winId) hideTaskTooltip(); });
        // 任务栏项拖拽重排（保留原注释与实现）
        interact($ti[0]).draggable({
            inertia: true,
            cursorChecker: () => 'default',
            listeners: {
                start(ev) {
                    const el = ev.target; const $el = $(el); $el.addClass('dragging'); el.style.cursor = 'move';
                    const rect = el.getBoundingClientRect();
                    const ph = createTaskPlaceholder(Math.round(rect.width));
                    el._taskDrag = { placeholder: ph, startIndex: Array.prototype.indexOf.call($taskCenter.children().not('.task-placeholder'), el), width: Math.round(rect.width), containerScrollLeft: $taskCenter.scrollLeft() };
                    $el.after(ph);
                },
                move(ev) {
                    const el = ev.target; const state = el._taskDrag; if (!state) return;
                    const dx = (parseFloat(el.getAttribute('data-dx')) || 0) + ev.dx;
                    const dy = (parseFloat(el.getAttribute('data-dy')) || 0) + ev.dy;
                    el.style.transform = `translate(${dx}px, ${dy}px)`; el.setAttribute('data-dx', dx); el.setAttribute('data-dy', dy);
                    const pointerX = (ev.page && ev.page.x) || ev.pageX || (ev.client && ev.client.x) || ev.clientX || 0;
                    const children = Array.from($taskCenter.children()).filter(n => !n.classList.contains('task-placeholder'));
                    let insertBeforeEl = null;
                    for (const child of children) {
                        if (child === el) continue;
                        const r = child.getBoundingClientRect();
                        const midpoint = r.left + r.width / 2 + (window.pageXOffset || 0);
                        if (pointerX < midpoint) { insertBeforeEl = child; break; }
                    }
                    const $placeholder = state.placeholder;
                    if (insertBeforeEl) { $(insertBeforeEl).before($placeholder); } else { $taskCenter.append($placeholder); }
                    hideTaskTooltip();
                },
                end(ev) {
                    const el = ev.target; const $el = $(el); const state = el._taskDrag;
                    el.style.cursor = 'default';
                    if (state && state.placeholder && state.placeholder.length) {
                        state.placeholder.replaceWith($el); el.style.transform = ''; el.removeAttribute('data-dx'); el.removeAttribute('data-dy'); $el.removeClass('dragging'); persistTaskOrder(); adjustTaskIconWidths(); delete el._taskDrag;
                    } else { el.style.transform = ''; el.removeAttribute('data-dx'); el.removeAttribute('data-dy'); $el.removeClass('dragging'); adjustTaskIconWidths(); delete el._taskDrag; }
                    setTimeout(updateTaskPagingControls, 120);
                }
            }
        });
        persistTaskOrder(); adjustTaskIconWidths();
    }
    function persistTaskOrder() { const order = Array.from($taskCenter.children()).map(x => $(x).data('win')); saveTaskOrder(order); }
    function persistWindows() {
        const arr = [];
        for (const id in windowsMap) {
            const m = windowsMap[id];
            arr.push({ id: m.id, app: m.app, title: m.title, content: m.$el.find('.content').html(), x: m.x, y: m.y, width: m.width, height: m.height, minimized: !!m.minimized, maximized: !!m.maximized, prevRect: m.prevRect });
        }
        try { localStorage.setItem(STORAGE_KEYS.windows, JSON.stringify(arr)); } catch (e) { console.warn('persistWindows failed', e); }
    }
    function restoreWindows() {
        const saved = loadWindowsState();
        if (!saved || !saved.length) return;
        saved.forEach(w => {
            winCounter = Math.max(winCounter, parseInt((w.id.match(/^win_(\d+)/) || [])[1]) || 0);
            createWindow({ app: w.app, title: w.title, content: w.content, x: w.x, y: w.y, width: w.width, height: w.height, minimized: w.minimized, maximized: w.maximized }, w.id);
            const meta = windowsMap[w.id];
            if (meta && w.prevRect) meta.prevRect = w.prevRect;
        });
        const order = loadTaskOrder();
        if (order.length) { order.forEach(id => { const el = $taskCenter.find(`[data-win="${id}"]`); if (el.length) $taskCenter.append(el); }); }
        Object.keys(windowsMap).forEach(id => { if (windowsMap[id].minimized) { /* 不添加缩略标记 */ } });
        adjustTaskIconWidths(); updateTaskPagingControls();
    }
    function tileLayout(mode) {
        const ids = Object.keys(windowsMap);
        if (ids.length === 0) return;
        if (mode === 'left' || mode === 'right') {
            const w = Math.floor($(window).width() / 2) - 12;
            const h = $(window).height() - 120;
            ids.forEach(id => {
                const m = windowsMap[id]; m.maximized = false; m.minimized = false;
                if (mode === 'left') { m.x = 8; m.y = 8; m.width = w; m.height = h; } else { m.x = w + 16; m.y = 8; m.width = w; m.height = h; }
                m.$el.css({ left: m.x + 'px', top: m.y + 'px', width: m.width + 'px', height: m.height + 'px' }).removeClass('minimized maxed-over');
            });
        } else if (mode === 'grid') {
            const cols = Math.ceil(Math.sqrt(ids.length));
            const rows = Math.ceil(ids.length / cols);
            const sw = $(window).width() - 32;
            const sh = $(window).height() - 140;
            const cw = Math.floor(sw / cols);
            const ch = Math.floor(sh / rows);
            ids.forEach((id, i) => {
                const r = Math.floor(i / cols), c = i % cols;
                const m = windowsMap[id];
                m.maximized = false; m.minimized = false;
                m.x = 8 + c * cw; m.y = 8 + r * ch; m.width = cw - 12; m.height = ch - 12;
                m.$el.css({ left: m.x + 'px', top: m.y + 'px', width: m.width + 'px', height: m.height + 'px' }).removeClass('minimized maxed-over');
            });
        }
        persistWindows();
    }
    function openApp(appId) {
        const tpl = appTemplates[appId] || { title: appId, icon: appId[0].toUpperCase(), content: '应用内容' };
        createWindow({ app: appId, title: tpl.title, icon: tpl.icon, content: tpl.content });
        persistTaskOrder(); adjustTaskIconWidths(); updateTaskPagingControls();
    }
    function rearrangeIconsGrid() {
        const icons = loadIconsState();
        if (!icons || icons.length === 0) return;
        const startX = 20, startY = 20;
        const colWidth = 100; const rowHeight = 120;
        const maxCols = Math.max(1, Math.floor((window.innerWidth - startX - 40) / colWidth));
        let col = 0, row = 0;
        icons.forEach((ic, idx) => {
            ic.x = startX + col * colWidth; ic.y = startY + row * rowHeight;
            row++; if (row * rowHeight + startY > window.innerHeight - 160) { row = 0; col++; }
            if (col >= maxCols) { col = 0; }
        });
        saveIconsState(icons); renderIcons();
    }
    function minimizeAllWindows() { Object.keys(windowsMap).forEach(id => { const m = windowsMap[id]; if (m && !m.minimized) minimizeWindow(id); }); }
    function restoreAllWindows() { Object.keys(windowsMap).forEach(id => { const m = windowsMap[id]; if (m && m.minimized) restoreFromTask(id); else if (m && !m.minimized) { bringToFront(id); } }); }
    function closeAllWindows() { const ids = Object.keys(windowsMap).slice(); ids.forEach(id => closeWindow(id)); }
    // ---------- 通用右键处理 ----------
    function hideDesktopMenu() { $desktopMenu.hide().attr('aria-hidden', 'true'); $(document).off('keydown.desktopMenu'); $desktopMenu.find('.item').removeAttr('tabindex'); }
    function hideTitlebarMenu() { $titlebarMenu.hide().attr('aria-hidden', 'true'); $titlebarMenu.find('.item').removeAttr('data-win'); }
    function hideStartClassic() { $startClassic.hide().attr('aria-hidden', 'true'); $startClassic.find('.menu-item').removeClass('open').find('.submenu').css({ transform: '' }); $(document).off('keydown.startClassic'); }
    document.addEventListener('contextmenu', function (ev) {
        const target = ev.target;
        const titlebarEl = target.closest && target.closest('.titlebar');
        if (titlebarEl) {
            ev.preventDefault(); ev.stopPropagation(); hideDesktopMenu(); hideStartClassic(); $preview.hide().empty(); $quickMenu.hide().attr('aria-hidden', 'true');
            const $win = $(titlebarEl).closest('.win'); const winId = $win.length ? $win.attr('id') : null;
            const mw = $titlebarMenu.outerWidth();
            let left = Math.min(window.innerWidth - mw - 8, Math.max(8, ev.clientX));
            let top = Math.min(window.innerHeight - 40 - 8, Math.max(8, ev.clientY));
            $titlebarMenu.css({ left: left + 'px', top: top + 'px', display: 'block' }).attr('aria-hidden', 'false');
            $titlebarMenu.data('win', winId);
            $(document).on('keydown.titlebarMenu', function (e) { if (e.key === 'Escape') { hideTitlebarMenu(); } });
            return;
        }
        const inDesktop = target.closest && target.closest('#desktop');
        const inWin = target.closest && target.closest('.win');
        const inIcon = target.closest && target.closest('.desk-icon');
        const inTaskbar = target.closest && (target.closest('#taskbar') || target.closest('#quickMenu') || target.closest('#titlebarMenu') || target.closest('#startClassic'));
        if (inDesktop && !inWin && !inIcon && !inTaskbar) {
            ev.preventDefault(); ev.stopPropagation(); hideTitlebarMenu(); hideStartClassic(); $preview.hide().empty(); $quickMenu.hide().attr('aria-hidden', 'true');
            const $menu = $desktopMenu; const mw = $menu.outerWidth(); const mh = $menu.outerHeight();
            let left = Math.min(window.innerWidth - mw - 8, Math.max(8, ev.clientX)); let top = Math.min(window.innerHeight - mh - 8, Math.max(8, ev.clientY));
            $menu.css({ left: left + 'px', top: top + 'px', display: 'block' });
            $menu.css('z-index', ++zIndexCounter + 1000);
            $menu.attr('aria-hidden', 'false').focus();
            $(document).on('keydown.desktopMenu', function (keyEv) {
                if (keyEv.key === 'Escape') { hideDesktopMenu(); }
                else if (keyEv.key === 'ArrowDown' || keyEv.key === 'ArrowUp') {
                    const items = $menu.find('.item'); const idx = items.index(document.activeElement);
                    if (keyEv.key === 'ArrowDown') { const next = items.get(Math.min(items.length - 1, Math.max(0, idx + 1))); next && next.focus(); }
                    else { const prev = items.get(Math.max(0, (idx <= 0 ? items.length - 1 : idx - 1))); prev && prev.focus(); }
                    keyEv.preventDefault();
                }
            });
            $menu.find('.item').attr('tabindex', '0');
            return;
        }
    }, true);
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#desktopMenu').length) { hideDesktopMenu(); }
        if (!$(e.target).closest('#titlebarMenu').length) { hideTitlebarMenu(); $(document).off('keydown.titlebarMenu'); }
        if (!$(e.target).closest('#quickMenu, #quickBtn').length) { $quickMenu.hide(); $quickMenu.attr('aria-hidden', 'true'); }
        if (!$(e.target).closest('#startClassic, #startBtn').length) { hideStartClassic(); }
        $preview.hide().empty();
        if (!$(e.target).closest('.task-icon').length) { hideTaskTooltip(); }
    });
    $desktopMenu.on('click', '.item', function (e) {
        e.stopPropagation(); const a = $(this).data('action');
        if (a === 'tile-left') tileLayout('left');
        if (a === 'tile-right') tileLayout('right');
        if (a === 'tile-grid') tileLayout('grid');
        if (a === 'rearrange-icons') rearrangeIconsGrid();
        // 新增：处理全屏与取消全屏
        if (a === 'fullscreen') {
            try { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen(); } catch (err) { }
        }
        if (a === 'exit-fullscreen') {
            try { if (document.exitFullscreen) document.exitFullscreen(); else if (document.webkitExitFullscreen) document.webkitExitFullscreen(); } catch (err) { }
        }
        if (a === 'refresh') { $('.wallpaper').fadeOut(80).fadeIn(80); }
        hideDesktopMenu();
    });
    $titlebarMenu.on('click', '.item', function (e) {
        e.stopPropagation(); const action = $(this).data('action'); const winId = $titlebarMenu.data('win');
        if (!winId) { hideTitlebarMenu(); return; }
        const meta = windowsMap[winId];
        if (!meta) { hideTitlebarMenu(); return; }
        if (action === 'minimize') { minimizeWindow(winId); } else if (action === 'maximize-restore') { toggleMaximize(winId); } else if (action === 'close') { closeWindow(winId); }
        hideTitlebarMenu();
    });
    // ---------- Win7 风格开始菜单数据与构建 ----------
    const startMenuData = [
        { label: '程序', iconColor: '#0b84ff', children: [{ label: '浏览器', iconImg: './icons/browser.png', action: 'openApp', app: 'browser' }, { label: '文件资源管理器', iconImg: './icons/explorer.png', action: 'openApp', app: 'explorer' }, { label: '便笺', iconImg: './icons/notes.png', action: 'openApp', app: 'notes' }, { label: '媒体播放器', iconImg: './icons/media.png', action: 'openApp', app: 'media' }, { label: '更多工具', iconColor: '#ef4444', children: [{ label: '网页面板', iconImg: './icons/webpanel.png', action: 'openApp', app: 'webpanel' }, { label: '平铺布局', iconColor: '#10b981', children: [{ label: '左侧平铺', iconColor: '#10b981', action: 'tile-left' }, { label: '右侧平铺', iconColor: '#10b981', action: 'tile-right' }, { label: '网格平铺', iconColor: '#10b981', action: 'tile-grid' }] }] }] },
        { label: '文档', iconColor: '#6366f1', children: [{ label: '重新排列桌面图标', iconColor: '#6366f1', action: 'rearrange-icons' }] },
        { label: '设置', iconImg: './icons/settings.png', children: [{ label: '打开“设置”窗口', iconImg: './icons/settings.png', action: 'openApp', app: 'settings' }] },
        { label: '操作', iconColor: '#f59e0b', children: [{ label: '最小化所有窗口', iconColor: '#f59e0b', action: 'minimize-all' }, { label: '恢复所有窗口', iconColor: '#f59e0b', action: 'restore-all' }, { label: '关闭所有窗口', iconColor: '#f59e0b', action: 'close-all' }] },
        { label: '退出', iconColor: '#e11d48', children: [{ label: '刷新壁纸', iconColor: '#e11d48', action: 'refresh' }] }
    ];
    function buildMenuList(items) {
        const $ul = $('<ul class="menu-list" role="menu"></ul>');
        items.forEach(item => {
            if (item.separator) { $ul.append('<li role="separator" style="margin:6px 4px;border-top:1px solid var(--border);"></li>'); return; }
            const $li = $('<li class="menu-item" role="menuitem" tabindex="-1"></li>');
            const $icon = $('<span class="icon"></span>');
            if (item.iconImg) { $icon.append($('<img>').attr('src', item.iconImg).attr('alt', '')); } else { $icon.css('background', item.iconColor || '#cbd5e1'); }
            const $label = $('<span class="label"></span>').text(item.label || '');
            $li.append($icon).append($label);
            if (item.children && item.children.length) {
                const $arrow = $('<span class="arrow" aria-hidden="true"></span>');
                const $submenu = $('<div class="submenu"></div>').append(buildMenuList(item.children));
                $li.append($arrow).append($submenu);
                $li.on('mouseenter focus', function () { $(this).siblings('.menu-item').removeClass('open').find('.submenu').css({ transform: '' }); $(this).addClass('open'); positionSubmenu($submenu, $li); });
                $li.on('mouseleave', function () { });
            } else {
                $li.on('click', function (e) { e.stopPropagation(); runStartAction(item); hideStartClassic(); });
            }
            $li.on('keydown', function (e) {
                const $items = $(this).closest('.menu-list').children('.menu-item');
                const idx = $items.index(this);
                if (e.key === 'ArrowDown') { e.preventDefault(); const next = $items.get(Math.min($items.length - 1, idx + 1)); next && next.focus(); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); const prev = $items.get(Math.max(0, idx - 1)); prev && prev.focus(); }
                else if (e.key === 'ArrowRight') { const $submenu = $(this).children('.submenu'); if ($submenu.length) { $(this).addClass('open'); positionSubmenu($submenu, $(this)); const first = $submenu.find('.menu-item').get(0); first && first.focus(); e.preventDefault(); } }
                else if (e.key === 'ArrowLeft') { const $parentMenu = $(this).closest('.submenu'); if ($parentMenu.length) { const $parentItem = $parentMenu.closest('.menu-item'); $parentItem.removeClass('open').focus(); e.preventDefault(); } }
                else if (e.key === 'Enter') { $(this).trigger('click'); }
                else if (e.key === 'Escape') { hideStartClassic(); }
            });
            $ul.append($li);
        });
        return $ul;
    }
    function positionStartClassic() {
        const btnRect = document.getElementById('startBtn').getBoundingClientRect();
        const mw = $startClassic.outerWidth();
        const mh = $startClassic.outerHeight();
        const left = Math.max(8, btnRect.left);
        const top = Math.max(8, btnRect.top - mh - 6);
        $startClassic.css({ left: left + 'px', top: top + 'px' });
    }
    function positionSubmenu($submenu, $item) {
        $submenu.removeClass('flip-left').css({ transform: '', top: '' });
        $submenu.css({ top: 0 });
        const rect = $submenu[0].getBoundingClientRect();
        const vw = window.innerWidth;
        if (rect.right > vw - 8) { $submenu.addClass('flip-left'); }
        const r = $submenu[0].getBoundingClientRect();
        const overflowBottom = r.bottom - (window.innerHeight - 8);
        const overflowTop = 8 - r.top;
        let ty = 0;
        if (overflowBottom > 0) { ty -= overflowBottom; }
        if (overflowTop > 0) { ty += overflowTop; }
        if (ty !== 0) { $submenu.css({ transform: `translateY(${Math.round(ty)}px)` }); }
    }
    function runStartAction(item) {
        const a = item.action;
        if (a === 'openApp' && item.app) { openApp(item.app); }
        else if (a === 'minimize-all') { minimizeAllWindows(); }
        else if (a === 'restore-all') { restoreAllWindows(); }
        else if (a === 'close-all') { closeAllWindows(); }
        else if (a === 'tile-left') { tileLayout('left'); }
        else if (a === 'tile-right') { tileLayout('right'); }
        else if (a === 'tile-grid') { tileLayout('grid'); }
        else if (a === 'rearrange-icons') { rearrangeIconsGrid(); }
        else if (a === 'refresh') { $('.wallpaper').fadeOut(80).fadeIn(80); }
    }
    function initStartClassic() { $startClassicRoot.empty().append(buildMenuList(startMenuData)); }
    $('#startBtn').on('click', function (e) {
        e.stopPropagation();
        if ($startClassic.is(':visible')) { hideStartClassic(); return; }
        initStartClassic();
        $startClassic.show().attr('aria-hidden', 'false');
        positionStartClassic();
        const first = $startClassic.find('.menu-item').get(0); first && first.focus();
        $(document).on('keydown.startClassic', function (e) { if (e.key === 'Escape') hideStartClassic(); });
    });
    $quickBtn.on('click', function (e) {
        e.stopPropagation();
        const btnRect = this.getBoundingClientRect();
        const mw = $quickMenu.outerWidth();
        const left = Math.min(window.innerWidth - mw - 8, Math.max(8, btnRect.left + (btnRect.width / 2) - (mw / 2)));
        const top = Math.max(8, btnRect.top - ($quickMenu.outerHeight() || 160) - 8);
        $quickMenu.css({ left: left + 'px', top: top + 'px', display: 'block' }).attr('aria-hidden', 'false');
    });
    $quickMenu.on('click', '.item', function (e) {
        e.stopPropagation();
        const a = $(this).data('action');
        if (a === 'minimize-all') minimizeAllWindows();
        if (a === 'restore-all') restoreAllWindows();
        if (a === 'close-all') closeAllWindows();
        $quickMenu.hide().attr('aria-hidden', 'true');
    });
    // 初始化与恢复
    $(function () {
        renderIcons();
        restoreWindows();
        // 绑定桌面双击空白处新建窗口示例（保留但不自动触发）
        $('#desktop').on('dblclick', function (e) {
            const inIcon = $(e.target).closest('.desk-icon').length;
            if (!inIcon) { openApp('explorer'); }
        });
        // 任务栏滚动时隐藏 tooltip
        $taskCenter.on('scroll', function () { hideTaskTooltip(); });
        // 键盘快捷键：Esc 取消所有弹出
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape') {
                hideDesktopMenu(); hideTitlebarMenu(); hideStartClassic(); $quickMenu.hide(); hideTaskTooltip();
            }
        });
        // 页面可见性变化时保存状态
        document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') { persistWindows(); persistTaskOrder(); } });
        // 初始调整
        setTimeout(function () { adjustTaskIconWidths(); updateTaskPagingControls(); }, 120);
    });
})(jQuery);

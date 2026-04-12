// 使用IIFE封装代码，避免全局污染
(function() {
    // ==================== 常量配置 ====================
    const STORAGE_KEYS = {
        SELECTED_NUMBERS: 'selectedNumbers',
        DATA_CYCLE_DATE: 'dataCycleDate'   // 记录当前选中数据所属的周期起始时间
    };

    const CLEAR_TIME = { hour: 10, minute: 23 };

    const ZODIAC_DATA = [
        { name: "马", branch: "午" }, { name: "蛇", branch: "巳" },
        { name: "龙", branch: "辰" }, { name: "兔", branch: "卯" },
        { name: "虎", branch: "寅" }, { name: "牛", branch: "丑" },
        { name: "鼠", branch: "子" }, { name: "猪", branch: "亥" },
        { name: "狗", branch: "戌" }, { name: "鸡", branch: "酉" },
        { name: "猴", branch: "申" }, { name: "羊", branch: "未" }
    ];
    const ZODIAC_NAMES = ZODIAC_DATA.map(item => item.name);

    const redSet = new Set([1,2,7,8,12,13,18,19,23,24,29,30,34,35,40,45,46]);
    const blueSet = new Set([3,4,9,10,14,15,20,25,26,31,36,37,41,42,47,48]);
    const greenSet = new Set([5,6,11,16,17,21,22,27,28,32,33,38,39,43,44,49]);

    const FIVE_ELEMENTS = {
        '金': [4,5,12,13,26,27,34,35,42,43],
        '木': [8,9,16,17,24,25,38,39,46,47],
        '水': [1,14,15,22,23,30,31,44,45],
        '火': [2,3,10,11,18,19,32,33,40,41,48,49],
        '土': [6,7,20,21,28,29,36,37]
    };

    let zodiacNumbers = null;
    let numberToElement = null;
    let currentSelected = [];
    let autoClearTimer = null;

    // ------------------- 工具函数 -------------------
    function generateZodiacNumbers() {
        const map = new Map();
        for (const z of ZODIAC_NAMES) map.set(z, []);
        for (let num = 1; num <= 49; num++) {
            const idx = (num - 1) % 12;
            map.get(ZODIAC_NAMES[idx]).push(num);
        }
        for (const z of ZODIAC_NAMES) map.get(z).sort((a,b)=>a-b);
        return map;
    }

    function generateNumberToElement() {
        const map = new Map();
        for (const [element, numbers] of Object.entries(FIVE_ELEMENTS)) {
            for (const num of numbers) map.set(num, element);
        }
        return map;
    }

    function getNumberBadgeClass(num) {
        if (redSet.has(num)) return 'badge-red';
        if (blueSet.has(num)) return 'badge-blue';
        if (greenSet.has(num)) return 'badge-green';
        return 'badge-red';
    }

    function getElementForNumber(num) {
        return numberToElement.get(num) || '';
    }

    function loadSelectedFromStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_NUMBERS);
            currentSelected = stored ? JSON.parse(stored) : [];
        } catch(e) {
            console.error(e);
            currentSelected = [];
        }
        return currentSelected;
    }

    function saveSelectedToStorage() {
        try {
            localStorage.setItem(STORAGE_KEYS.SELECTED_NUMBERS, JSON.stringify(currentSelected));
        } catch(e) {
            console.error(e);
        }
    }

    function saveDataCycleDate(date) {
        try {
            localStorage.setItem(STORAGE_KEYS.DATA_CYCLE_DATE, formatDateTime(date));
        } catch(e) {}
    }

    function loadDataCycleDate() {
        try {
            const str = localStorage.getItem(STORAGE_KEYS.DATA_CYCLE_DATE);
            return str ? parseDateTime(str) : null;
        } catch(e) {
            return null;
        }
    }

    function formatDateTime(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth()+1).padStart(2,'0');
        const d = String(date.getDate()).padStart(2,'0');
        const h = String(date.getHours()).padStart(2,'0');
        const min = String(date.getMinutes()).padStart(2,'0');
        const s = String(date.getSeconds()).padStart(2,'0');
        return `${y}${m}${d} ${h}:${min}:${s}`;
    }

    function parseDateTime(str) {
        if (!str) return null;
        const match = str.match(/^(\d{4})(\d{2})(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
        if (!match) return null;
        const [_, y, m, d, h, min, s] = match;
        return new Date(parseInt(y), parseInt(m)-1, parseInt(d), parseInt(h), parseInt(min), parseInt(s));
    }

    function getClearTimeOfDate(date) {
        const clearDate = new Date(date);
        clearDate.setHours(CLEAR_TIME.hour, CLEAR_TIME.minute, 0, 0);
        return clearDate;
    }

    function getCurrentCycleStart(now) {
        const todayClear = getClearTimeOfDate(now);
        if (now >= todayClear) return todayClear;
        const yesterdayClear = new Date(todayClear);
        yesterdayClear.setDate(yesterdayClear.getDate() - 1);
        return yesterdayClear;
    }

    // 检查并清空过期数据（基于数据所属周期）
    function checkAndClearData() {
        const now = new Date();
        const currentCycleStart = getCurrentCycleStart(now);
        const storedCycle = loadDataCycleDate();
        let needClear = false;
        if (storedCycle && storedCycle < currentCycleStart) {
            needClear = true;
        }
        if (needClear) {
            currentSelected = [];
            saveSelectedToStorage();
            localStorage.removeItem(STORAGE_KEYS.DATA_CYCLE_DATE);
            renderList();
        }
        return needClear;
    }

    // 当用户主动选中号码时，更新数据所属周期为当前周期
    function updateDataCycleToCurrent() {
        const now = new Date();
        const currentCycleStart = getCurrentCycleStart(now);
        saveDataCycleDate(currentCycleStart);
    }

    // 定时器：每天22:32自动清空
    function scheduleAutoClear() {
        if (autoClearTimer) clearTimeout(autoClearTimer);
        const now = new Date();
        let nextClear = getClearTimeOfDate(now);
        if (now >= nextClear) nextClear.setDate(nextClear.getDate() + 1);
        const delay = nextClear - now;
        autoClearTimer = setTimeout(() => {
            checkAndClearData();
            scheduleAutoClear();
        }, delay);
    }

    function updateZodiacNameColor(zodiacName) {
        const row = document.querySelector(`.zodiac-row[data-zodiac="${zodiacName}"]`);
        if (!row) return;
        const nameSpan = row.querySelector('.zodiac-name');
        const numbers = zodiacNumbers.get(zodiacName);
        const hasSelected = numbers.some(num => currentSelected.includes(num));
        if (hasSelected) nameSpan.classList.add('zodiac-name-red');
        else nameSpan.classList.remove('zodiac-name-red');
    }

    function renderList() {
        const container = document.getElementById('zodiacListContainer');
        if (!container) return;
        let html = '';
        for (let i = 0; i < ZODIAC_DATA.length; i++) {
            const { name: zodiac, branch } = ZODIAC_DATA[i];
            const numbers = zodiacNumbers.get(zodiac);
            
            // 检查生肖是否被选中
            const isZodiacSelected = currentSelected.includes(zodiac);
            // 检查该生肖是否有选中的号码
            const hasSelectedNumber = numbers.some(num => currentSelected.includes(num));
            
            // 生肖样式
            let zodiacClass = 'zodiac-name';
            if (isZodiacSelected) {
                zodiacClass += ' badge-black';
            } else if (hasSelectedNumber) {
                zodiacClass += ' zodiac-name-red';
            }
            
            let numbersHtml = '';
            for (let num of numbers) {
                const badgeClass = getNumberBadgeClass(num);
                const isSelected = currentSelected.includes(num);
                const finalClass = isSelected ? `${badgeClass} badge-black` : badgeClass;
                const element = getElementForNumber(num);
                const elementClass = element ? `element-${element}` : '';
                numbersHtml += `
                    <div class="number-element-pair">
                        <span class="number-badge ${finalClass}" data-num="${num}">${num}</span>
                        <span class="element-label ${elementClass}">${element}</span>
                    </div>
                `;
            } 
            html += `
                <div class="zodiac-row" data-zodiac="${zodiac}">
                    <div class="numbers-elements-container">
                        <div class="zodiac-header">
                            <span class="${zodiacClass}">${zodiac}</span>
                            <span class="zodiac-branch">${branch}</span>
                        </div>
                        ${numbersHtml}
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    }

    function initEventDelegate() {
        const container = document.getElementById('zodiacListContainer');
        if (!container) return;
        container.addEventListener('click', (e) => {
            // 处理号码点击
            const badge = e.target.closest('.number-badge');
            if (badge) {
                const num = parseInt(badge.dataset.num);
                const idx = currentSelected.indexOf(num);
                if (idx === -1) currentSelected.push(num);
                else currentSelected.splice(idx, 1);
                saveSelectedToStorage();
                updateDataCycleToCurrent();   // 数据变化，更新所属周期
                badge.classList.toggle('badge-black');
                let targetZodiac = null;
                for (const [zodiac, numbers] of zodiacNumbers) {
                    if (numbers.includes(num)) { targetZodiac = zodiac; break; }
                }
                if (targetZodiac) updateZodiacNameColor(targetZodiac);
                return;
            }
            
            // 处理生肖点击
            const zodiacName = e.target.closest('.zodiac-name');
            if (zodiacName) {
                const zodiac = zodiacName.textContent.trim();
                
                // 切换生肖的选中状态
                zodiacName.classList.toggle('badge-black');
                
                // 检查生肖是否被选中
                const isSelected = zodiacName.classList.contains('badge-black');
                
                // 保存生肖到本地存储
                if (isSelected) {
                    // 添加到选中列表
                    if (!currentSelected.includes(zodiac)) {
                        currentSelected.push(zodiac);
                    }
                } else {
                    // 从选中列表中移除
                    const idx = currentSelected.indexOf(zodiac);
                    if (idx > -1) {
                        currentSelected.splice(idx, 1);
                    }
                }
                
                // 保存到本地存储
                saveSelectedToStorage();
                updateDataCycleToCurrent();   // 数据变化，更新所属周期
            }
        });
    }

    function initClearButton() {
        const btn = document.getElementById('clearBtn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            currentSelected = [];
            saveSelectedToStorage();
            localStorage.removeItem(STORAGE_KEYS.DATA_CYCLE_DATE);
            renderList();
        });
    }

    function init() {
        zodiacNumbers = generateZodiacNumbers();
        numberToElement = generateNumberToElement();
        loadSelectedFromStorage();
        checkAndClearData();   // 页面加载时检查周期，过期则清空
        renderList();
        initEventDelegate();
        initClearButton();
        scheduleAutoClear();   // 启动每日22:32自动清空调度
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
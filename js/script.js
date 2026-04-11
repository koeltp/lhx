// 固定生肖顺序（马、蛇、龙、兔、虎、牛、鼠、猪、狗、鸡、猴、羊）
const CUSTOM_ZODIAC_ORDER = ["马", "蛇", "龙", "兔", "虎", "牛", "鼠", "猪", "狗", "鸡", "猴", "羊"];

// 配置：清空数据的时间点（小时:分钟）
const CLEAR_TIME = {
    hour: 21,
    minute: 38
};

// 生肖对应地支
const ZODIAC_TO_EARTHLY_BRANCH = {
    "马": "午",
    "蛇": "巳",
    "龙": "辰",
    "兔": "卯",
    "虎": "寅",
    "牛": "丑",
    "鼠": "子",
    "猪": "亥",
    "狗": "戌",
    "鸡": "酉",
    "猴": "申",
    "羊": "未"
};

// 波色定义（原始标准）
const redSet = new Set([1,2,7,8,12,13,18,19,23,24,29,30,34,35,40,45,46]);      // 红波保持不变
const blueSet = new Set([3,4,9,10,14,15,20,25,26,31,36,37,41,42,47,48]);      // 原绿波 → 现在应显示为蓝色背景（所以用 badge-blue）
const greenSet = new Set([5,6,11,16,17,21,22,27,28,32,33,38,39,43,44,49]);     // 原蓝波 → 现在应显示为绿色背景（所以用 badge-green）

// 获取波色 CSS 类（类名与实际颜色一致）
function getNumberBadgeClass(num) {
    if (redSet.has(num)) return 'badge-red';
    if (blueSet.has(num)) return 'badge-blue';   // 原绿波 → 显示蓝色（badge-blue 现在是真正的蓝色）
    if (greenSet.has(num)) return 'badge-green'; // 原蓝波 → 显示绿色（badge-green 现在是真正的绿色）
    return 'badge-red';
}

// 生成生肖->号码映射（固定顺序循环1-49）
function generateZodiacNumbers() {
    const map = new Map();
    for (const z of CUSTOM_ZODIAC_ORDER) {
        map.set(z, []);
    }
    for (let num = 1; num <= 49; num++) {
        const idx = (num - 1) % 12;
        const zodiac = CUSTOM_ZODIAC_ORDER[idx];
        map.get(zodiac).push(num);
    }
    // 升序
    for (const z of CUSTOM_ZODIAC_ORDER) {
        map.get(z).sort((a,b) => a - b);
    }
    return map;
}

const zodiacNumbers = generateZodiacNumbers();

// 五行映射
const FIVE_ELEMENTS = {
    '金': [4, 5, 12, 13, 26, 27, 34, 35, 42, 43],
    '木': [8, 9, 16, 17, 24, 25, 38, 39, 46, 47],
    '水': [1, 14, 15, 22, 23, 30, 31, 44, 45],
    '火': [2, 3, 10, 11, 18, 19, 32, 33, 40, 41, 48, 49],
    '土': [6, 7, 20, 21, 28, 29, 36, 37]
};

// 生成号码到五行的映射
const numberToElement = new Map();
for (const [element, numbers] of Object.entries(FIVE_ELEMENTS)) {
    for (const num of numbers) {
        numberToElement.set(num, element);
    }
}

// 获取号码的五行属性
function getElementForNumber(num) {
    return numberToElement.get(num) || '';
}

// 从本地存储获取选中的号码
function getSelectedNumbersFromStorage() {
    try {
        const stored = localStorage.getItem('selectedNumbers');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('读取本地存储失败:', error);
        return [];
    }
}

// 保存选中的号码到本地存储
function saveSelectedNumbersToStorage() {
    const selectedNumbers = [];
    const blackBadges = document.querySelectorAll('.number-badge.badge-black');
    blackBadges.forEach(badge => {
        selectedNumbers.push(parseInt(badge.dataset.num));
    });
    try {
        localStorage.setItem('selectedNumbers', JSON.stringify(selectedNumbers));
        // 更新上次访问时间
        const now = new Date();
        localStorage.setItem('lastVisitDate', formatDateTime(now));
    } catch (error) {
        console.error('保存本地存储失败:', error);
    }
}

// 渲染简洁行列表
function renderList() {
    const container = document.getElementById('zodiacListContainer');
    if (!container) return;
    
    // 获取本地存储的选中号码
    const selectedNumbers = getSelectedNumbersFromStorage();
    
    let html = '';
    for (let i = 0; i < CUSTOM_ZODIAC_ORDER.length; i++) {
        const zodiac = CUSTOM_ZODIAC_ORDER[i];
        const numbers = zodiacNumbers.get(zodiac);
        const isStarter = (zodiac === "马");
        const starterBadge = '';
        
        // 检查该生肖是否有选中的号码
        const hasSelectedNumbers = numbers.some(num => selectedNumbers.includes(num));
        const zodiacNameClass = hasSelectedNumbers ? 'zodiac-name zodiac-name-red' : 'zodiac-name';
        
        // 生成带波色背景的号码标签和五行
        let numbersHtml = '';
        for (let num of numbers) {
            const badgeClass = getNumberBadgeClass(num);
            const isSelected = selectedNumbers.includes(num);
            const finalClass = isSelected ? `${badgeClass} badge-black` : badgeClass;
            const element = getElementForNumber(num);
            const elementClass = `element-${element}`;
            numbersHtml += `
                <div class="number-element-pair">
                    <span class="number-badge ${finalClass}" data-num="${num}">${num}</span>
                    <span class="element-label ${elementClass}">${element}</span>
                </div>
            `;
        }
        
        const branch = ZODIAC_TO_EARTHLY_BRANCH[zodiac];
        html += `
            <div class="zodiac-row">
                <div class="zodiac-info">
                    <div class="zodiac-name-container">
                        <span class="${zodiacNameClass}">${zodiac}${starterBadge}</span>
                    </div>
                    <div class="zodiac-branch-container">
                        <span class="zodiac-branch">${branch}</span>
                    </div>
                </div>
                <div class="numbers-elements-container">
                    ${numbersHtml}
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
    
    // 添加点击事件监听器
    const numberBadges = document.querySelectorAll('.number-badge');
    numberBadges.forEach(badge => {
        badge.addEventListener('click', function() {
            this.classList.toggle('badge-black');
            saveSelectedNumbersToStorage();
            // 重新渲染以更新生肖名称颜色
            renderList();
        });
    });
}

// 清空选择功能
function initClearButton() {
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            // 移除所有黑色标记
            const allBadges = document.querySelectorAll('.number-badge');
            allBadges.forEach(badge => {
                badge.classList.remove('badge-black');
            });
            
            // 清空本地存储
            try {
                localStorage.removeItem('selectedNumbers');
            } catch (error) {
                console.error('清空本地存储失败:', error);
            }
        });
    }
}

// 格式化日期为 yyyyMMdd HH:mm:ss 格式
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day} ${hours}:${minutes}:${seconds}`;
}

// 解析 yyyyMMdd HH:mm:ss 格式的日期字符串
function parseDateTime(dateTimeStr) {
    if (!dateTimeStr) return null;
    const parts = dateTimeStr.split(' ');
    if (parts.length !== 2) return null;
    const datePart = parts[0];
    const timePart = parts[1];
    if (datePart.length !== 8 || timePart.length !== 8) return null;
    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6)) - 1;
    const day = parseInt(datePart.substring(6, 8));
    const timeParts = timePart.split(':');
    if (timeParts.length !== 3) return null;
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    const seconds = parseInt(timeParts[2]);
    return new Date(year, month, day, hours, minutes, seconds);
}

// 检查是否需要清空数据（每天指定时间第一次访问）
function checkAndClearData() {
    const now = new Date();
    
    // 计算今天的指定时间点
    const todayClearTime = new Date(now);
    todayClearTime.setHours(CLEAR_TIME.hour, CLEAR_TIME.minute, 0, 0);
    
    // 根据当前时间确定有效时间范围
    let startTime, endTime;
    if (now < todayClearTime) {
        // 今天还没过指定时间，有效范围是昨天指定时间到今天指定时间
        startTime = new Date(now);
        startTime.setDate(startTime.getDate() - 1);
        startTime.setHours(CLEAR_TIME.hour, CLEAR_TIME.minute, 0, 0);
        endTime = todayClearTime;
    } else {
        // 今天已过指定时间，有效范围是今天指定时间到明天指定时间
        startTime = todayClearTime;
        endTime = new Date(now);
        endTime.setDate(endTime.getDate() + 1);
        endTime.setHours(CLEAR_TIME.hour, CLEAR_TIME.minute, 0, 0);
    }
    
    // 获取上次访问时间
    const lastVisitDateStr = localStorage.getItem('lastVisitDate');
    const lastVisitDate = parseDateTime(lastVisitDateStr);
    
    // 检查是否需要清空数据：
    // 如果上次访问时间不在有效时间范围内
    if (!lastVisitDate || lastVisitDate < startTime || lastVisitDate >= endTime) {
        // 清空选中的号码
        try {
            localStorage.removeItem('selectedNumbers');
        } catch (error) {
            console.error('清空本地存储失败:', error);
        }
        // 清空后更新访问时间
        try {
            localStorage.setItem('lastVisitDate', formatDateTime(now));
        } catch (error) {
            console.error('保存访问日期失败:', error);
        }
    }
}

// 初始化
function init() {
    checkAndClearData();
    renderList();
    initClearButton();
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
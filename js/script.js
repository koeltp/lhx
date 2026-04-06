// 固定生肖顺序（马、蛇、龙、兔、虎、牛、鼠、猪、狗、鸡、猴、羊）
const CUSTOM_ZODIAC_ORDER = ["马", "蛇", "龙", "兔", "虎", "牛", "鼠", "猪", "狗", "鸡", "猴", "羊"];

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
        
        // 生成带波色背景的号码标签
        let numbersHtml = '';
        for (let num of numbers) {
            const badgeClass = getNumberBadgeClass(num);
            const isSelected = selectedNumbers.includes(num);
            const finalClass = isSelected ? `${badgeClass} badge-black` : badgeClass;
            numbersHtml += `<span class="number-badge ${finalClass}" data-num="${num}">${num}</span>`;
        }
        
        html += `
            <div class="zodiac-row">
                <span class="zodiac-name">${zodiac}${starterBadge}</span>
                <span class="numbers-area">${numbersHtml}</span>
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
        });
    });
}

// 控制台验证关键号码波色
function debugCheck() {
    console.log("=== 类名已修正：badge-green=绿色，badge-blue=蓝色 ===");
    console.log("25号(原绿波) → 应显示蓝色背景，实际class:", getNumberBadgeClass(25));
    console.log("37号(原绿波) → 应显示蓝色背景，实际class:", getNumberBadgeClass(37));
    console.log("49号(原蓝波) → 应显示绿色背景，实际class:", getNumberBadgeClass(49));
    console.log("5号(原蓝波) → 应显示绿色背景，实际class:", getNumberBadgeClass(5));
    console.log("马号码列表:", zodiacNumbers.get("马").join(", "));
    console.log("蛇号码列表:", zodiacNumbers.get("蛇").join(", "));
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

// 检查是否需要清空数据（每天21:40第一次访问）
function checkAndClearData() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDate = now.toDateString();
    
    // 获取上次访问日期
    const lastVisitDate = localStorage.getItem('lastVisitDate');
    
    // 检查是否是21:40之后的第一次访问
    if (currentHour > 21 || (currentHour === 21 && currentMinute >= 40)) {
        if (lastVisitDate !== currentDate) {
            // 清空选中的号码
            try {
                localStorage.removeItem('selectedNumbers');
            } catch (error) {
                console.error('清空本地存储失败:', error);
            }
            // 更新上次访问日期
            try {
                localStorage.setItem('lastVisitDate', currentDate);
            } catch (error) {
                console.error('保存访问日期失败:', error);
            }
        }
    }
}

// 初始化
function init() {
    checkAndClearData();
    renderList();
    debugCheck();
    initClearButton();
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
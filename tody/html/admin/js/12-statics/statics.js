$(function() {
    // 날짜 초기화 (오늘 - 1개월 ~ 오늘)
    const currentChart = {
        dailyNewUsersChart: null,
        dailyVisitorsChart: null,
        hourlyVisitorsChart: null,      // 구현되었다면
        weekdayVisitorsChart: null,     // 구현되었다면
        hourlyDurationChart: null,
        weekDurationChart: null,
        monthlyDurationChart: null,
        pageDurationChart: null,
        userDurationChart: null
    };
    
    const ALL_STAT_TYPES = [
        'dailyNewUsers',
        'dailyVisitors',
        'hourlyVisitors',      
        'weekdayVisitors',     
        'hourlyDuration',  
        'weekdayDuration', 
        'monthlyDuration', 
        'pageDuration', 
        'userDuration' 
    ];
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    $('#startDate').val(formatDate(oneMonthAgo));
    $('#endDate').val(formatDate(today));

    // Datepicker 설정
    $('#startDate, #endDate').datepicker({
        dateFormat: 'yy-mm-dd',
        changeMonth: true,
        changeYear: true
    });

    // 데이터 조회 및 차트/테이블 렌더링 함수
    async function fetchDataAndRender(statType) {
        const startDate = $('#startDate').val();
        const endDate = $('#endDate').val();

        try {
            const response = await fetch('/admin/back/12-visit/get_statistics.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDate, endDate, statType })
            });
            const result = await response.json();

            if (result.status === 'success') {
                renderStatistic(statType, result.data);
            } else {
                alert('데이터 조회 실패: ' + result.message);
                console.error(`API Error for ${statType}:`, result.message);
                throw new Error(result.message); // Promise.all에서 에러를 잡기 위해 throw
            }
        } catch (error) {
            alert('데이터 통신 오류: ' + error.message);
            console.error(`Fetch Error for ${statType}:`, error);
            throw error; // Promise.all에서 에러를 잡기 위해 throw
        }
    }

    // 통계 항목별 렌더링 함수
    function renderStatistic(statType, data) {
        // 기존 차트 파괴 (메모리 누수 방지)
        if (currentChart[statType]) {
            currentChart[statType].destroy();
        }

        // 모든 통계 섹션 숨김, 선택된 섹션만 표시
        //$('.stat-section').removeClass('active');
        //$(`#${statType}`).addClass('active');

        // 데이터 렌더링 로직 (Chart.js 및 테이블)
        switch (statType) {
            case 'dailyNewUsers':
                renderDailyNewUsers(data);
                break;
            case 'dailyVisitors':
                renderDailyVisitors(data);
                break;
            case 'hourlyVisitors':
                renderHourlyVisitors(data);
                break;
            case 'weekdayVisitors':
                renderWeekdayVisitors(data);
                break;
            case 'hourlyDuration':
                renderHourlyDuration(data);
                break;
            case 'weekdayDuration':
                renderWeekdayDuration(data);
                break;
            case 'monthlyDuration':
                renderMonthlyDuration(data);
                break;
            case 'pageDuration':
                renderPageDuration(data);
                break;
            case 'userDuration':
                renderUserDuration(data); // 주로 테이블 형태로
                break;
        }
    }
    
    async function loadAllStatistics() {
        const startDate = $('#startDate').val(); // 시작 날짜 가져오기 (UI에서)
        const endDate = $('#endDate').val();     // 종료 날짜 가져오기 (UI에서)
    
        // 로딩 시작 (전체 페이지 또는 특정 영역)
        // showOverallLoadingSpinner(); 
    
        try {
            // 모든 fetchDataAndRender 호출을 Promise 배열로 만듭니다.
            const fetchPromises = ALL_STAT_TYPES.map(type => {
                return fetchDataAndRender(type); // 각 타입별로 fetch 호출
            });
    
            // 모든 Promise가 완료될 때까지 기다립니다.
            await Promise.all(fetchPromises);
    
        } catch (error) {
            console.error("일부 통계 차트 로드 중 오류 발생:", error);
            alert("일부 통계 데이터를 불러오는 데 실패했습니다. 자세한 내용은 콘솔을 확인해주세요.");
    
        } finally {
            // 로딩 종료
            // hideOverallLoadingSpinner();
        }
    }

    // --- 각 통계 항목별 렌더링 함수 예시 (Chart.js와 테이블) ---
    // 플러그인 로드가 되어 있다고 가정 (예: <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>)
    function renderDailyNewUsers(data) {
        const labels = [...new Set(data.map(row => row.stat_date))].sort();
        
        const roleColors = {
            '001': 'rgba(54, 162, 235, 0.7)',
            '002': 'rgba(255, 159, 64, 0.7)',
            '003': 'rgba(75, 192, 192, 0.7)',
        };
        const roleLabels = {
            '001': '일반',
            '002': '중계사',
            '003': '금융회원',
        };

        const datasets = Object.keys(roleLabels).map(roleKeyString => {
            const dataPoints = labels.map(date => {
                const found = data.find(row => {
                    return row.stat_date === date && row.role === roleKeyString;
                });
                return found ? parseFloat(found.cumulative_user_count) : 0;
            });
            
            return {
                label: roleLabels[roleKeyString],
                data: dataPoints,
                backgroundColor: roleColors[roleKeyString],
                borderColor: roleColors[roleKeyString].replace('0.7', '1'),
                borderWidth: 1,
                // 개별 데이터셋 레이블 설정을 위한 plugin options (이전과 동일)
                datalabels: {
                    color: 'white', // 개별 레이블 색상
                    font: {  size: 10 },
                    formatter: function(value, context) {
                        // 첫 번째, 중간, 마지막 데이터셋에만 값 표시 (역할 세그먼트 기준)
                        const datasetCount = context.chart.data.datasets.length - 1; // 총합 데이터셋 제외
                        const datasetIndex = context.datasetIndex;

                        const isFirst = (datasetIndex === 0);
                        const isLast = (datasetIndex === datasetCount - 1); // 0부터 시작하므로
                        const isMiddle = (datasetCount > 2 && datasetIndex === Math.floor((datasetCount -1 ) / 2)); // 3개 이상일 때만 중간

                        if (value > 0 && (isFirst || isLast || isMiddle)) {
                            return value;
                        }
                        return '';
                    }
                }
            };
        });

        // --- 총합 레이블을 위한 별도의 투명한 데이터셋 추가 ---
        const totalData = labels.map(date => {
            let sum = 0;
            Object.keys(roleLabels).forEach(roleKeyString => {
                const found = data.find(row => row.stat_date === date && row.role === roleKeyString);
                sum += found ? parseFloat(found.cumulative_user_count) : 0;
            });
            return sum;
        });

        datasets.push({
            label: '', //  '총합' 라벨 제거
            data: totalData,
            backgroundColor: 'rgba(0,0,0,0)', // 투명하게 설정
            borderColor: 'rgba(0,0,0,0)', // 투명하게 설정
            pointRadius: 0, // 점 숨기기
            datalabels: {
                color: 'black', // 총합 레이블은 다른 색상
                align: 'center',   // 가로 중앙 정렬
                anchor: 'start',  // 막대 끝(위)에 앵커
                offset: 10,     // 막대에서 위로 3px 띄우기
                font: {  size: 10 },
                formatter: function(value, context) {
                    const totalBars = context.chart.data.labels.length;
                    const currentBarIndex = context.dataIndex;
    
                    const isFirstBar = (currentBarIndex === 0);
                    const isLastBar = (currentBarIndex === totalBars - 1);
                    const isMiddleBar = (totalBars > 2 && currentBarIndex === Math.floor(totalBars / 2));
    
                    if (value > 0 && (isFirstBar || isLastBar || isMiddleBar)) {
                        return `(${value})`; // <--- 이 부분을 `(${value})`로 변경!
                    }
                    return '';
                }
            }
        });
    
        const ctx = document.getElementById('dailyNewUsersChart').getContext('2d');
        if (currentChart.dailyNewUsers) currentChart.dailyNewUsers.destroy();
    
        currentChart.dailyNewUsers = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    datalabels: { // 이 최상위 datalabels 설정은 모든 데이터셋에 적용될 기본값입니다.
                                  // 개별 dataset.datalabels 옵션이 우선합니다.
                        display: true, // 기본적으로 표시하지만, 개별 formatter에서 조절합니다.
                        anchor: 'center' // 개별 세그먼트 값의 앵커는 중앙으로
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: '일자' },
                        stacked: true
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: '가입자수' },
                        stacked: true
                    }
                }
            },
            plugins: [ChartDataLabels] // ChartDataLabels 플러그인 활성화
        });
        
        // 5. 테이블 렌더링 (역할별 컬럼) - 이 부분은 데이터가 확인되면 정상 작동할 것입니다.
        // --- 테이블 렌더링 (총합 컬럼 추가) ---
        let tableHtml = '<table><thead><tr><th style="width: 20%";>일자</th>';
        Object.values(roleLabels).forEach(label => {
            tableHtml += `<th style="width: 20%">${label}</th>`;
        });
        tableHtml += `<th style="width: 20%">총합</th>`; // 총합 헤더 추가
        tableHtml += '</tr></thead><tbody>';

        labels.forEach(date => {
            tableHtml += `<tr><td>${date}</td>`;
            let rowTotal = 0; // 해당 날짜의 총합 초기화

            Object.keys(roleLabels).forEach(roleKeyString => {
                const found = data.find(row => row.stat_date === date && row.role === roleKeyString);
                const count = found ? parseFloat(found.cumulative_user_count) : 0;
                tableHtml += `<td>${count}</td>`;
                rowTotal += count; // 총합에 더하기
            });
            tableHtml += `<td>${rowTotal}</td>`; // 총합 셀 추가
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        $('#dailyNewUsersTable').html(tableHtml);
    }

    function renderDailyVisitors(data) {
        const labels = [...new Set(data.map(row => row.stat_date))].sort();
        
        // user_type별 색상과 라벨 정의 (여기 키 값을 수정합니다!)
        const userTypeColors = {
            'registered': 'rgba(54, 162, 235, 0.7)',   // 실제 데이터 'registered' 키 사용
            'guest': 'rgba(255, 159, 64, 0.7)',     // 실제 데이터 'guest' 키 사용
        };
    
        const userTypeLabels = {
            'registered': '회원', // 키는 'registered'로, 라벨은 '회원'으로
            'guest': '비회원',     // 키는 'guest'로, 라벨은 '비회원'으로
        };
    
        // 역할별 방문자수 데이터셋 생성
        const datasets = Object.keys(userTypeLabels).map(userTypeKey => { // userTypeKey로 변경 (실제 데이터 키)
            const dataPoints = labels.map((date) => {
                const found = data.find(row => {
                    // 수정된 userTypeKey와 row.user_type을 비교합니다.
                    return row.stat_date === date && row.user_type === userTypeKey; 
                });
                return found ? parseFloat(found.visitor_count) : 0;
            });
    
            return {
                label: userTypeLabels[userTypeKey], // 라벨은 한글로 표시
                data: dataPoints,
                backgroundColor: userTypeColors[userTypeKey],
                borderColor: userTypeColors[userTypeKey].replace('0.7', '1'),
                borderWidth: 1,
                datalabels: {
                    color: 'white',
                    font: { size: 10 },
                    formatter: function(value, context) {
                        const userTypeDatasetCount = Object.keys(userTypeLabels).length; 
                        const datasetIndex = context.datasetIndex;
    
                        const isFirst = (datasetIndex === 0);
                        const isLast = (datasetIndex === userTypeDatasetCount - 1);
                        const isMiddle = (userTypeDatasetCount > 2 && datasetIndex === Math.floor((userTypeDatasetCount - 1) / 2));
    
                        if (value > 0 && (isFirst || isLast || isMiddle)) {
                            return `(${value})`;
                        }
                        return '';
                    }
                }
            };
        });
    
        // --- 총방문자수 레이블을 위한 별도의 투명한 데이터셋 추가 ---
        const totalData = labels.map(date => {
            let sum = 0;
            // 여기도 userTypeKey를 사용합니다.
            Object.keys(userTypeLabels).forEach(userTypeKey => { 
                const found = data.find(row => row.stat_date === date && row.user_type === userTypeKey);
                sum += found ? parseFloat(found.visitor_count) : 0;
            });
            return sum;
        });
    
        datasets.push({
            label: '', //총방문자수 라벨 제거
            data: totalData,
            backgroundColor: 'rgba(0,0,0,0)',
            borderColor: 'rgba(0,0,0,0)',
            pointRadius: 0,
            datalabels: {
                color: 'black',
                align: 'center',
                anchor: 'start',
                offset: 5,
                font: { size: 10 },
                formatter: function(value, context) {
                    const totalBars = context.chart.data.labels.length;
                    const currentBarIndex = context.dataIndex;
    
                    const isFirstBar = (currentBarIndex === 0);
                    const isLastBar = (currentBarIndex === totalBars - 1);
                    const isMiddleBar = (totalBars > 2 && currentBarIndex === Math.floor(totalBars / 2));
    
                    if (value > 0 && (isFirstBar || isLastBar || isMiddleBar)) {
                        return `(${value})`;
                    }
                    return '';
                }
            }
        });
    
        // --- Chart 객체 생성 ---
        const ctx = document.getElementById('dailyVisitorsChart').getContext('2d');
        if (currentChart.dailyVisitors) currentChart.dailyVisitors.destroy();
    
        currentChart.dailyVisitors = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    datalabels: {
                        display: true,
                        anchor: 'center'
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: '일자' },
                        stacked: true
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: '방문자수' },
                        stacked: true
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
        
        // --- 테이블 렌더링 ---
        let tableHtml = '<table><thead><tr>'
            + '<th style="width: 25%;">일자</th>'
            + '<th style="width: 25%;">회원</th>'
            + '<th style="width: 25%;">비회원</th>'
            + '<th style="width: 25%;">총 방문자</th>'
            + '</tr></thead><tbody>';
    
        labels.forEach(date => {
            // 여기도 user_type 값을 'registered'와 'guest'로 수정합니다.
            const regData = data.find(row => row.stat_date === date && row.user_type === 'registered');
            const regCount = regData ? parseInt(regData.visitor_count) : 0;
    
            const guestData = data.find(row => row.stat_date === date && row.user_type === 'guest');
            const guestCount = guestData ? parseInt(guestData.visitor_count) : 0;
    
            const totalCount = regCount + guestCount;
    
            tableHtml += `<tr>`
                + `<td>${date}</td>`
                + `<td>${regCount}명</td>`
                + `<td>${guestCount}명</td>`
                + `<td>${totalCount}명</td>`
                + `</tr>`;
        });
    
        tableHtml += '</tbody></table>';
        $('#dailyVisitorsTable').html(tableHtml);
    }

    // --- 시간대별 방문자수 렌더링 함수 (예시) ---
    function renderHourlyVisitors(data) {
        const labels = Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}시`); // 00시 ~ 23시
        const visitorCounts = Array(24).fill(0);
        data.forEach(row => {
            visitorCounts[parseInt(row.stat_hour)] = row.visitor_count;
        });

        const ctx = document.getElementById('hourlyVisitorsChart').getContext('2d');
        currentChart.hourlyVisitors = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '시간대별 방문자수',
                    data: visitorCounts,
                    backgroundColor: 'rgba(153, 102, 255, 0.5)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 2,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: '시간대' } },
                    y: { beginAtZero: true, title: { display: true, text: '방문자수' } }
                }
            }
        });

        let tableHtml = '<table><thead><tr>'
            + '<th style="width: 50%;">시간대</th>'
            + '<th style="width: 50%;">방문자수</th>';

        labels.forEach((label, i) => {
            tableHtml += `<tr><td>${label}</td><td>${visitorCounts[i]}명</td></tr>`;
        });
        tableHtml += '</tbody></table>';
        $('#hourlyVisitorsTable').html(tableHtml);
    }

    // --- 요일별 방문자수 렌더링 함수 (예시) ---
    function renderWeekdayVisitors(data) {
        const dayLabels = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const visitorCounts = Array(7).fill(0);
        data.forEach(row => {
            visitorCounts[parseInt(row.stat_weekday)] = row.visitor_count;
        });

        const ctx = document.getElementById('weekdayVisitorsChart').getContext('2d');
        currentChart.weekdayVisitors = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dayLabels,
                datasets: [{
                    label: '요일별 방문자수',
                    data: visitorCounts,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: '요일' } },
                    y: { beginAtZero: true, title: { display: true, text: '방문자수' } }
                }
            }
        });

        let tableHtml = '<table><thead><tr>'
            + '<th style="width: 50%;">요일</th>'
            + '<th style="width: 50%;">방문자수</th>';

        dayLabels.forEach((label, i) => {
            tableHtml += `<tr><td>${label}</td><td>${visitorCounts[i]}명</td></tr>`;
        });
        tableHtml += '</tbody></table>';
        $('#weekdayVisitorsTable').html(tableHtml);
    }
    // --- 시간대별 머문시간 함수들)
    function renderHourlyDuration(data) {
        
        const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}시`);
        
        const avgDurationDataPoints = labels.map((hourLabel) => {
            const hour = parseInt(hourLabel.replace('시', ''));
            const found = data.find(row => row.stat_hour === hour);
            
            // --- 디버깅 시작 지점 1: avgDurationDataPoints 생성 시점 ---
            const rawValue = found ? found.average_duration_per_user_minutes : null;
            const parsedValue = found ? parseFloat(found.average_duration_per_user_minutes) : 0;
            
            return parsedValue; // `parsedValue`를 반환합니다.
        });
        
        const datasets = [
            {
                label: '사용자당 평균 체류 시간 (분)',
                data: avgDurationDataPoints,
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                datalabels: {
                    color: 'white',
                    font: { size: 10 },
                    formatter: function(val, context) { // `value` 대신 `val`로 인자명 변경 (혼동 방지)
                        // --- 디버깅 시작 지점 2: formatter 함수 내부 ---
                        const numericValue = parseFloat(val); // 다시 한번 숫자로 확실히 변환
                        
                        // 유효한 숫자인지, 그리고 0보다 큰지 확인합니다.
                        if (typeof numericValue === 'number' && !isNaN(numericValue) && numericValue > 0) {
                            return `${numericValue.toFixed(1)}분`;
                        }
                        // --------------------------------------------------
                        return '';
                    }
                }
            }
        ];
    
        // --- Chart 객체 생성 ---
        const ctx = document.getElementById('hourlyDurationChart').getContext('2d');
        if (currentChart.hourlyDurationChart) currentChart.hourlyDurationChart.destroy();
    
        currentChart.hourlyDurationChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        offset: 5, // 필요 시 조절 (막대 위에서 얼마나 띄울지)
                        color: 'black'
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: '시간대' },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: '사용자당 평균 체류 시간 (분)' }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
        
        // --- 테이블 렌더링 ---
        let tableHtml = '<table><thead><tr>'
            + '<th style="width: 50%;">시간대</th>'
            + '<th style="width: 50%;">사용자당 평균 체류 시간 (분)</th>'
            + '</tr></thead><tbody>';
    
        labels.forEach(hourLabel => {
            const hour = parseInt(hourLabel.replace('시', ''));
            const found = data.find(row => row.stat_hour === hour);
            const avgDuration = found ? parseFloat(found.average_duration_per_user_minutes) : 0; // 테이블도 동일하게 처리
    
            tableHtml += `<tr>`
                + `<td>${hourLabel}</td>`
                + `<td>${avgDuration.toFixed(1)}분</td>` // 소수점 한 자리까지 표시
                + `</tr>`;
        });
    
        tableHtml += '</tbody></table>';
        $('#hourlyDurationTable').html(tableHtml);
    }

    function renderWeekdayDuration(data) { // 함수 이름 변경
        // X축 레이블: 0=일요일, 6=토요일에 맞춰 명시적으로 생성
        const labels = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        
        // 각 요일별 사용자당 평균 체류 시간을 매핑
        const avgDurationDataPoints = labels.map((weekdayLabel, index) => {
            // SQL에서 DAYOFWEEK(start_time) - 1은 0=일요일, 6=토요일
            // labels의 인덱스와 stat_weekday를 직접 매칭
            const statWeekday = index; 
            const found = data.find(row => row.stat_weekday === statWeekday);
            // 컬럼 이름 average_duration_per_user_minutes 사용
            return found ? parseFloat(found.average_duration_per_user_minutes) : 0;
        });
        
        // 단일 데이터셋 생성
        const datasets = [
            {
                label: '요일별 사용자당 평균 체류 시간 (분)', // 라벨 변경
                data: avgDurationDataPoints,
                backgroundColor: 'rgba(255, 99, 132, 0.7)', // 색상 변경 (예시)
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                datalabels: {
                    color: 'white',
                    font: { size: 10 },
                    formatter: function(val) {
                        const numericValue = parseFloat(val);
                        if (typeof numericValue === 'number' && !isNaN(numericValue) && numericValue > 0) {
                            return `${numericValue.toFixed(1)}분`;
                        }
                        return '';
                    }
                }
            }
        ];
    
        // --- Chart 객체 생성 ---
        const ctx = document.getElementById('weekdayDurationChart').getContext('2d'); // 차트 ID는 적절히 변경
        // 기존 차트가 있다면 파괴하여 메모리 누수 방지
        if (currentChart.weekdayDuration) currentChart.weekdayDuration.destroy();
    
        currentChart.weekdayDuration = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        offset: 5,
                        color: 'black'
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: '요일' }, // X축 제목 변경
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: '사용자당 평균 체류 시간 (분)' } // Y축 제목 변경
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
        
        // --- 테이블 렌더링 ---
        let tableHtml = '<table><thead><tr>'
            + '<th style="width: 50%;">요일</th>'
            + '<th style="width: 50%;">사용자당 평균 체류 시간 (분)</th>' // 테이블 헤더 변경
            + '</tr></thead><tbody>';
    
        labels.forEach((weekdayLabel, index) => { // label과 index 사용
            const statWeekday = index;
            const found = data.find(row => row.stat_weekday === statWeekday);
            const avgDuration = found ? parseFloat(found.average_duration_per_user_minutes) : 0;
    
            tableHtml += `<tr>`
                + `<td>${weekdayLabel}</td>`
                + `<td>${avgDuration.toFixed(1)}분</td>` // 소수점 한 자리까지 표시
                + `</tr>`;
        });
    
        tableHtml += '</tbody></table>';
        $('#weekdayDurationTable').html(tableHtml); // HTML에 'weekdayDurationTable' ID를 가진 div가 필요합니다.
    }

    function renderMonthlyDuration(data) { 
        
        let labels = [];
        let targetYear;
    
        if (data && data.length > 0) {
            // 데이터가 있다면 첫 번째 데이터의 연도를 기준으로 잡습니다.
            // (일반적으로 데이터가 특정 단일 연도에 집중될 것이라 가정)
            targetYear = parseInt(data[0].stat_month.substring(0, 4));
        } else {
            // 데이터가 없다면 현재 연도를 기준으로 잡습니다.
            targetYear = new Date().getFullYear();
        }
    
        // 1월부터 12월까지 모든 월의 레이블을 생성합니다.
        for (let month = 1; month <= 12; month++) {
            const monthStr = String(month).padStart(2, '0');
            labels.push(`${targetYear}-${monthStr}`);
        }
    
        // 각 월별 사용자당 평균 체류 시간을 매핑
        const avgDurationDataPoints = labels.map((monthLabel) => {
            const found = data.find(row => row.stat_month === monthLabel);
            return found ? parseFloat(found.average_duration_per_user_minutes) : 0;
        });
        
        // 단일 데이터셋 생성
        const datasets = [
            {
                label: '월별 사용자당 평균 체류 시간 (분)',
                data: avgDurationDataPoints,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                datalabels: {
                    color: 'white',
                    font: { size: 10 },
                    formatter: function(val) { // val을 숫자로 변환 후 유효성 검사
                        const numericValue = parseFloat(val);
                        if (typeof numericValue === 'number' && !isNaN(numericValue) && numericValue > 0) {
                            return `${numericValue.toFixed(1)}분`;
                        }
                        return '';
                    }
                }
            }
        ];
    
        // --- Chart 객체 생성 ---
        const ctx = document.getElementById('monthlyDurationChart').getContext('2d');
        if (currentChart.monthlyDuration) currentChart.monthlyDuration.destroy();
    
        currentChart.monthlyDuration = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        offset: 5,
                        color: 'black'
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: '월' },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: '사용자당 평균 체류 시간 (분)' }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
        
        // --- 테이블 렌더링 ---
        let tableHtml = '<table><thead><tr>'
            + '<th style="width: 50%;">월</th>'
            + '<th style="width: 50%;">사용자당 평균 체류 시간 (분)</th>'
            + '</tr></thead><tbody>';
    
        labels.forEach(monthLabel => {
            const found = data.find(row => row.stat_month === monthLabel);
            const avgDuration = found ? parseFloat(found.average_duration_per_user_minutes) : 0;
    
            tableHtml += `<tr>`
                + `<td>${monthLabel}</td>`
                + `<td>${avgDuration.toFixed(1)}분</td>`
                + `</tr>`;
        });
    
        tableHtml += '</tbody></table>';
        $('#monthlyDurationTable').html(tableHtml);
    }
    function renderPageDuration(data){
        
        // 데이터에서 모든 고유한 페이지 제목을 추출하여 labels로 사용
        // SQL에서 이미 page_title로 정렬되어 있으므로 별도 sort()는 필요 없지만,
        // 혹시 몰라 Set과 sort()를 통해 고유하고 정렬된 값을 사용합니다.
        //const labels = [...new Set(data.map(row => row.stat_page_title))].sort(); 
        let labels = ['메인','실거래가','매물정보','삽니다','팝니다','금융지원','제휴/제안','나의정보'];
            
        // 각 페이지 제목별 사용자당 평균 체류 시간을 매핑
        const avgDurationDataPoints = labels.map((pageTitle) => {
            const found = data.find(row => row.stat_page_title === pageTitle);
            // 컬럼 이름 average_duration_per_user_on_page_minutes 사용
            return found ? parseFloat(found.average_duration_per_user_on_page_minutes) : 0;
        });
        
        // 단일 데이터셋 생성
        const datasets = [
            {
                label: '페이지별 사용자당 평균 체류 시간 (분)', // 라벨 변경
                data: avgDurationDataPoints,
                backgroundColor: 'rgba(255, 206, 86, 0.7)', // 색상 변경 (예시)
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1,
                datalabels: {
                    color: 'white',
                    font: { size: 10 },
                    formatter: function(val) { // val을 숫자로 변환 후 유효성 검사
                        const numericValue = parseFloat(val);
                        if (typeof numericValue === 'number' && !isNaN(numericValue) && numericValue > 0) {
                            return `${numericValue.toFixed(1)}분`;
                        }
                        return '';
                    }
                }
            }
        ];

        // --- Chart 객체 생성 ---
        // 새로운 차트 ID를 사용하는 것이 좋습니다. 예: pageTitleDurationChart
        const ctx = document.getElementById('pageDurationChart').getContext('2d'); 
        // 기존 차트가 있다면 파괴하여 메모리 누수 방지
        if (currentChart.pageDuration) currentChart.pageDuration.destroy();

        currentChart.pageDuration = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        offset: 5,
                        color: 'black'
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: '페이지 제목' }, // X축 제목 변경
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: '사용자당 평균 체류 시간 (분)' } // Y축 제목 변경
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
        
        // --- 테이블 렌더링 ---
        let tableHtml = '<table><thead><tr>'
            + '<th style="width: 50%;">페이지 제목</th>'
            + '<th style="width: 50%;">사용자당 평균 체류 시간 (분)</th>' // 테이블 헤더 변경
            + '</tr></thead><tbody>';

        labels.forEach(pageTitle => {
            const found = data.find(row => row.stat_page_title === pageTitle);
            const avgDuration = found ? parseFloat(found.average_duration_per_user_on_page_minutes) : 0;

            tableHtml += `<tr>`
                + `<td>${pageTitle}</td>`
                + `<td>${avgDuration.toFixed(1)}분</td>` // 소수점 한 자리까지 표시
                + `</tr>`;
        });

        tableHtml += '</tbody></table>';
        // 새로운 테이블 ID를 사용하는 것이 좋습니다. 예: pageTitleDurationTable
        $('#pageDurationTable').html(tableHtml); 
    }
    function renderUserDuration(data) { /* 주로 테이블 */ 
        
        const labels = ['회원', '비회원']; // 차트 X축 레이블은 항상 '회원'과 '비회원'
        
        // 데이터에서 'registered'와 'guest' 각각의 평균 체류 시간을 찾아 매핑
        const registeredAvg = data.find(row => row.user_type === 'registered');
        const guestAvg = data.find(row => row.user_type === 'guest');

        const averageDataPoints = [
            registeredAvg ? parseFloat(registeredAvg.average_duration_minutes) : 0, // 'registered' 데이터가 없으면 0
            guestAvg ? parseFloat(guestAvg.average_duration_minutes) : 0             // 'guest' 데이터가 없으면 0
        ];
        
        // 단일 데이터셋 생성 (두 개의 막대가 다른 색상으로 표시되도록)
        const datasets = [
            {
                label: '사용자 유형별 사용자당 평균 체류 시간 (분)',
                data: averageDataPoints,
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)', // 회원 색상
                    'rgba(255, 159, 64, 0.7)'  // 비회원 색상
                ], 
                borderColor: [
                    'rgb(168, 197, 197)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1,
                datalabels: {
                    color: 'white',
                    font: { size: 10 },
                    formatter: function(val) { // val을 숫자로 변환 후 유효성 검사
                        const numericValue = parseFloat(val);
                        if (typeof numericValue === 'number' && !isNaN(numericValue) && numericValue > 0) {
                            return `${numericValue.toFixed(1)}분`; // 소수점 한 자리까지 표시
                        }
                        return '';
                    }
                }
            }
        ];
        
        // --- Chart 객체 생성 ---
        // 새로운 차트 ID를 사용하는 것이 좋습니다. 예: overallUserAverageDurationChart
        const ctx = document.getElementById('userDurationChart').getContext('2d'); 
        if (currentChart.userDuration) currentChart.userDuration.destroy();

        currentChart.userDuration = new Chart(ctx, {
            type: 'bar', // 바 차트
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }, // '회원', '비회원' 레이블이 명확하므로 범례는 숨깁니다.
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        offset: 5,
                        color: 'black'
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: '사용자 유형' },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: '사용자당 평균 체류 시간 (분)' } // Y축 제목
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
        
        // --- 테이블 렌더링 ---
        let tableHtml = '<table><thead><tr>'
            + '<th style="width: 50%;">사용자 유형</th>'
            + '<th style="width: 50%;">사용자당 평균 체류 시간 (분)</th>'
            + '</tr></thead><tbody>';

        // labels 배열의 순서대로 테이블 행을 추가합니다.
        labels.forEach((userTypeLabel, index) => {
            const average = averageDataPoints[index];
            tableHtml += `<tr>`
                + `<td>${userTypeLabel}</td>`
                + `<td>${average.toFixed(1)}분</td>`
                + `</tr>`;
        });

        tableHtml += '</tbody></table>';
        // 새로운 테이블 ID를 사용하는 것이 좋습니다. 예: overallUserAverageDurationTable
        $('#userDurationTable').html(tableHtml); 
    }

    // 이벤트 핸들러
    $('#applyFilter').on('click', () => {
        loadAllStatistics();
    });

    
    // 초기 로드 시 오늘 날짜의 '일자별 가입자수' 데이터 로드
    loadAllStatistics();
});
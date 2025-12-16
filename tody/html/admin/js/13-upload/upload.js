// upload.js
// 문서가 완전히 로드되고 DOM이 준비되었을 때 실행 (jQuery ready 함수 사용)
$(document).ready(async function () {
    "use strict";

    // ===============================================================
    // 전역/공유 변수 및 DOM 요소 캐싱

    // 날짜 선택 select 요소 캐싱
    const startYearSelect = document.getElementById('startYear');
    const endYearSelect = document.getElementById('endYear');
    const baseYearSelect = document.getElementById('baseYear');
    const startMonthSelect = document.getElementById('startMonth');
    const endMonthSelect = document.getElementById('endMonth');
    const baseMonthSelect = document.getElementById('baseMonth');
    
    // 메인 페이지 본문의 시도 체크박스 그룹 (fieldset.sido-checkboxes-group)
    const sidoAllCheck_mainPage = document.getElementById('sidoAllCheck'); // "전체 시도 (ALL)"
    const sidoCheckboxes_mainPage = document.querySelectorAll('.sido-checkboxes-container .sido-checkbox'); // 개별 시도 체크박스들
    
    // 기타 주요 DOM 요소 캐싱
    const descriptionSection = document.querySelector('.discription-section');
    const uploadStartBtn_main = $('#uploadStartBtn'); // ★ 메인 페이지 본문의 시작 버튼
    const dateSelectionGroup = document.querySelector('.date-selection-group'); // ★ 날짜 선택 그룹
    const cancelBatchBtn = $('#cancelBatchBtn');           // ===>>> jQuery 객체 <<<===
    // tabLinks는 initEvents 내에서 선언되므로 여기서는 제거
    
    // Redis 캐시 탭의 이력 테이블 요소 (history_view_realcache)
    // ID 변경: 'history_view_realcache_redistab'으로 HTML과 매칭
    const historyViewRealcacheTable = $('#history_view_realcache_redistab'); 
    
    // Redis 캐시 로그 관련 요소 (이제 공통 상태 섹션에 위치)
    // 순수 DOM 객체로 캐싱하여 사용
    const batchLogViewer_redisTab = document.getElementById('batchLogViewer_redisTab');
    const refreshLogBtn_redisTab = document.getElementById('refreshLogBtn_redisTab');

    // 이력 섹션 (각 탭에 따라 동적으로 내용이 변경될 div)
    const batchHistorySectionContent = $('#batchhistory');
    //const batchHistorySectionContent = $('#batchHistorySectionContent'); // 이 jQuery 객체가 어떤 HTML 요소를 참조하나요?

    // 배치 상태 정보를 표시하는 span 요소들 (상태 섹션 통합 HTML에서 id 변경 없음)
    const currentStatusSpan = document.getElementById('currentStatus');
    const lastRunTimeSpan = document.getElementById('lastRunTime');
    const lastCompletionTimeSpan = document.getElementById('lastCompletionTime');

    // ===============================================================
    // Redis 배치 상태 및 로그 폴링 전역 변수
    // ===============================================================
    let batchStatusInterval = null; // 폴링 setInterval ID 저장
    let currentBatchId = null; // 현재 진행 중인 배치 ID (어떤 task_type이든)
    let lastLogLineCount = 0; // 이전에 가져온 로그 라인 수 (새로운 로그만 추가하기 위함)
    let activeTaskType = null; // 현재 활성화된 탭의 task_type
    
    // ===============================================================
    // 유틸리티 함수 정의
    // ===============================================================

    // 년도 채우는 함수 (2020년 ~ 2040년)
    function populateYears(selectElement) {
        for (let year = 2020; year <= 2040; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year + '년';
            selectElement.appendChild(option);
        }
    }

    // 월 채우는 함수 (1월 ~ 12월)
    function populateMonths(selectElement) {
        for (let month = 1; month <= 12; month++) {
            const option = document.createElement('option');
            // value를 '01', '02' 형식으로 채워 PHP/DB 처리와 일관성 유지
            option.value = (month < 10 ? '0' : '') + month; 
            option.textContent = month + '월';
            selectElement.appendChild(option);
        }
    }
    
    // 탭 내용과 버튼 텍스트를 업데이트하는 통합 함수
    // 이 함수는 현재 로직에서 호출되지만, Redis 상태 섹션의 UI 업데이트는 별도로 처리됩니다.
    async function updateContentAndButton(dataType) {
        //debugger; // updateContentAndButton 진입 확인

        activeTaskType = dataType; // 현재 활성화된 탭의 task_type 저장

        let descriptionContent = '';
        let buttonText = '시작 버튼';
        let showDateSelection = true; // 기본적으로 dateSelectionGroup을 보이게 설정
        let showstartDateSelection = true; 
        let showendDateSelection = true; 
        let showbaseDateSelection = true; 
        const logHeading = document.getElementById('logHeading_redisTab');
        const histotyTitle = document.getElementById('historyTitle');
        
        switch (dataType) {
            case 'characteristic':
                descriptionContent  = '<p>Redis의 토지특성정보를 초기화하고 DB에서 토지 특성 정보를 Redis 캐시에 저장합니다. <span style="color: red;">(시도 선택 필수)</span></p>';
                buttonText = '토지 특성 정보를 Redis 캐시에 업로드 시작';
                logHeading.textContent = '[토지 특성 정보 Redis 캐시 배치 스크립트 로그]';
                showDateSelection = false;
                break;
            case 'realprice':
                descriptionContent  = '<p>국토교통부 실거래가 데이터를 수집하여 DB에 저장합니다. 대량의 데이터 처리로 시간이 소요될 수 있습니다. <span style="color: red;">(시도, 시작, 종료 연월 선택 필수)</span></p>';
                buttonText = '국토교통부에서 실거래가 데이터를 가져오기 시작';
                logHeading.textContent = '[국토교통부에서 실거래가 데이터를 가져오기 스크립트 로그]';
                showDateSelection = true;
                showstartDateSelection = true;
                showendDateSelection = true;
                showbaseDateSelection = false;
                break;
            case 'rediscache':
                descriptionContent  = '<p>읍면동 단위로 실거래가 데이터를 DB에서 Redis 캐시를 생성/업데이트합니다. <span style="color: red;">(시도 선택 필수)</span></p>';
                buttonText = '실거래가(읍면동 단위)를 Redis 캐시에 업로드 시작'; // 메인 시작 버튼의 텍스트
                logHeading.textContent = '[실거래가(읍면동 단위) Redis 캐시 배치 스크립트 로그]';
                showDateSelection = false; // Redis 캐시 작업은 날짜 선택이 필요 없음
                break;
            case 'realpriceAverage':
                descriptionContent  = '<p>시도/시군구/읍면동 단위로 실거래 평균가 데이터를 업데이트합니다.</p>';
                buttonText = '실거래 평균가를 테이블에 업데이트 시작'; // 메인 시작 버튼의 텍스트
                logHeading.textContent = '[실거래가 평균가 테이블 업데이트 스크립트 로그]';
                showDateSelection = true; 
                showstartDateSelection = false;
                showendDateSelection = false;
                showbaseDateSelection = true;
                break;
            default:
                descriptionContent = '<p>배치 작업을 선택하고 시작 버튼을 클릭해주세요.</p>';
                buttonText = '시작';
                logHeading.textContent = '[로그]';
                break;
        }

        if (descriptionSection) {
            descriptionSection.innerHTML = descriptionContent;
        }
        if (uploadStartBtn_main) { 
            uploadStartBtn_main.textContent = buttonText;
            $(uploadStartBtn_main).show(); // 모든 탭에서 이 버튼을 사용하므로 항상 보임
        }
        if (dateSelectionGroup) {
             // dateSelectionGroup은 순수 DOM 객체이므로 style.display를 직접 조작합니다.
            dateSelectionGroup.style.display = showDateSelection ? '' : 'none';
            if(showbaseDateSelection){
                startYearSelect.parentElement.style.display = 'none';
                startMonthSelect.parentElement.style.display = 'none';
                endYearSelect.parentElement.style.display = 'none';
                endMonthSelect.parentElement.style.display = 'none';
                baseYearSelect.parentElement.style.display = '';
                baseMonthSelect.parentElement.style.display = '';
            }
            else {
                startYearSelect.parentElement.style.display = '';
                startMonthSelect.parentElement.style.display = '';
                endYearSelect.parentElement.style.display = '';
                endMonthSelect.parentElement.style.display = '';
                baseYearSelect.parentElement.style.display = 'none';
                baseMonthSelect.parentElement.style.display = 'none';
            }
            

        }
        
        
        // 특정 탭 선택 시 관련 UI 요소들의 표시 여부
        $('.discription-section').show();
        if(dataType === 'realpriceAverage'){
            $('.sido-checkboxes-group').hide();
        }
        else {
            $('.sido-checkboxes-group').show();
        }
        $('.target-status-section').show(); // 이제 모든 탭에서 상태 섹션을 표시합니다.
        $('.target-button-section').show();
        $('.target-history-section').show();
        
        // 기존에 진행 중이던 폴링 중지
        if (batchStatusInterval) {
            clearInterval(batchStatusInterval);
            batchStatusInterval = null;
        }
        currentBatchId = null; // 탭 전환 시 currentBatchId 초기화
        
        // 현재 탭의 최신 배치 상태를 로드하고 폴링 시작
        await loadInitialBatchStatus(dataType);
        
        // 초기 로드 시 active 탭에 따라 이력을 로드
        historyTablerefresh(dataType);
        // 이력 제목 업데이트
        historyTitle.textContent = getHistoryTitle(dataType);
    }

    // 초기 로딩 시 특정 task_type의 최신 배치 상태를 가져와 UI 업데이트
    async function loadInitialBatchStatus(taskType) {
        
        currentStatusSpan.textContent = '상태 확인 중...';
        lastRunTimeSpan.textContent = '-';
        lastCompletionTimeSpan.textContent = '-';
        batchLogViewer_redisTab.innerHTML = '';
        lastLogLineCount = 0;

        //debugger; // loadInitialBatchStatus 진입 확인
        uploadStartBtn_main.disabled = true; // 상태 로딩 중에는 버튼 비활성화

        try {
            // 해당 task_type의 마지막 배치 ID를 가져오는 API 호출
            const response = await fetch(`/front/back/admin/get_last_batch_id.php?task_type=${taskType}`); // 새로운 API 엔드포인트
            const result = await response.json();

            if (result.success === true && result.history_id !== null && result.history_id !== 0) {
                currentBatchId = result.history_id;
                // UI에 currentBatchId 표시
                currentStatusSpan.textContent = `진행 중 [id:${currentBatchId}]`; 
                
                startBatchPolling(currentBatchId); // <-- 여기서는 폴링만 시작
            } else {
                currentStatusSpan.textContent = '대기 중';
                lastRunTimeSpan.textContent = '-';
                lastCompletionTimeSpan.textContent = '-';
                batchLogViewer_redisTab.innerHTML = '현재 활성화된 작업 또는 이전 작업 기록이 없습니다.';
                lastLogLineCount = 0;
                uploadStartBtn_main.disabled = false;
            }
        } catch (error) {
            //console.error(`Error loading initial batch status for ${taskType}:`, error);
            currentStatusSpan.textContent = '상태 로드 오류';
            batchLogViewer_redisTab.innerHTML = `[오류] 초기 상태 로드 실패: ${error.message}`;
            uploadStartBtn_main.disabled = false;
        } finally {
            // finally 블록에서 버튼을 활성화하는 것은 initial history가 없는 경우에만 필요
            // history_id가 있으면 startBatchPolling 내부의 fetchBatchProgress가 처리
            // 이 블록에서는 버튼 비활성화 해제하지 않는 것이 더 나음 (fetchBatchProgress가 책임지도록)
            // if (!currentBatchId || currentBatchId === null) {
            //     uploadStartBtn_main.disabled = false;
            // }
            // 일관성을 위해 일단 주석처리하고 fetchBatchProgress에 맡김.
        }
    }
    // ===>>> 여기부터 추적 시작 <<<===
    //debugger; 
    // ===============================================================
    // 초기화 로직 (페이지 로드 시 실행)
    // ===============================================================

    // 년/월 드롭다운 옵션 채우기
    populateYears(startYearSelect);
    populateYears(endYearSelect);
    populateYears(baseYearSelect);
    populateMonths(startMonthSelect);
    populateMonths(endMonthSelect);
    populateMonths(baseMonthSelect);

    // 현재 년/월로 기본값 설정
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    startYearSelect.value = currentYear;
    endYearSelect.value = currentYear;
    baseYearSelect.value = currentYear;
    startMonthSelect.value = (currentMonth < 10 ? '0' : '') + currentMonth;
    endMonthSelect.value = (currentMonth < 10 ? '0' : '') + currentMonth;
    if(currentMonth === 1){
        baseMonthSelect.value = (currentMonth < 10 ? '0' : '') + currentMonth-1+12;
        baseYearSelect.value = currentYear-1;
    }
    else {  
        baseMonthSelect.value = (currentMonth < 10 ? '0' : '') + currentMonth-1;
    }

    initEvents(); // 모든 이벤트 리스너 등록

    // 페이지 로드 시 초기 탭에 대한 UI 업데이트
    const initialActiveTab = document.querySelector('#upload_nav .nav-link.active');
    if (initialActiveTab && initialActiveTab.dataset.type) {
        updateContentAndButton(initialActiveTab.dataset.type);
    }

    function initEvents() {
        // 탭 링크 이벤트 리스너 등록
        const tabLinks = document.querySelectorAll('#upload_nav .nav-link');
        tabLinks.forEach(link => {
            link.addEventListener('shown.bs.tab', function (event) {
                const activatedTab = event.target; 
                const dataType = activatedTab.dataset.type;

                updateContentAndButton(dataType);// UI 업데이트 (여기서 activeTaskType)
            });
        });

        if (sidoAllCheck_mainPage) {
            sidoAllCheck_mainPage.addEventListener('change', function() {
                sidoCheckboxes_mainPage.forEach(checkbox => {
                    checkbox.checked = sidoAllCheck_mainPage.checked;
                });
            });
        }
        
        sidoCheckboxes_mainPage.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const allIndividualChecked = Array.from(sidoCheckboxes_mainPage).every(cb => cb.checked);
                if (sidoAllCheck_mainPage) {
                    sidoAllCheck_mainPage.checked = allIndividualChecked;
                }
            });
        });

        // ===============================================================
        // 배치 작업 시작 버튼 클릭 이벤트 (모든 업로드 작업 시작 버튼)
        // ===============================================================
        $(uploadStartBtn_main).on("click", async function () {
            // 현재 활성화된 탭의 dataType을 activeTaskType 전역 변수에서 가져옴
            const currentDataType = activeTaskType;

            // 이미 폴링이 진행 중 = 작업이 진행 중
            if (batchStatusInterval) {
                alert('이미 배치 작업이 진행 중입니다. 잠시 기다려주세요.');
                return;
            }
            
            // --- 모든 탭에서 공통적으로 사용할 파라미터 준비 ---
            const startYear = startYearSelect.value;
            const startMonth = startMonthSelect.value;
            const endYear = endYearSelect.value;
            const endMonth = endMonthSelect.value;
            const baseYear = baseYearSelect.value;
            const baseMonth = baseMonthSelect.value;

            let selectedSidos = [];
            // "전체 시도" 체크박스 상태 확인
            if (sidoAllCheck_mainPage && sidoAllCheck_mainPage.checked) {
                selectedSidos.push('ALL');
            } else {
                // 개별 시도 체크박스 상태 확인
                sidoCheckboxes_mainPage.forEach(checkbox => {
                    if (checkbox.checked) {
                        selectedSidos.push(checkbox.value);
                    }
                });
            }

            // 특정 dataType에 따라 시도 선택 필수 여부 확인 (예: rediscache)
            if (selectedSidos.length === 0 && (currentDataType !== 'realpriceAverage')) {
                alert("처리할 시도를 최소 하나 이상 선택해주세요.");
                return;
            }
            const sidoParam = selectedSidos.join(',');

            // --- UI 업데이트 (시작 전) ---
            $(this).prop('disabled', true).text('작업 실행 중...');
            currentStatusSpan.textContent = '작업 실행 중';
            lastRunTimeSpan.textContent = '-';
            lastCompletionTimeSpan.textContent = '-';
            batchLogViewer_redisTab.innerHTML = ''; // 기존 로그 지우기
            lastLogLineCount = 0;


            // --- API 호출 로직 ---
            let apiUrl = '';
            let requestBody = { task_type: currentDataType, sido: sidoParam }; // task_type 파라미터 추가
            
            switch (currentDataType) {
                case 'characteristic':
                    apiUrl = '/front/back/admin/trigger_characteristic_batch.php';
                    // 토지특성은 날짜 선택이 필요 없으므로 requestBody에 날짜 파라미터는 생략
                    Object.assign(requestBody, {
                        task_type: currentDataType, 
                        sido: sidoParam 
                    });
                    //추후 개발
                    break;
                case 'realprice':
                    apiUrl = '/front/back/admin/trigger_data_upload.php';
                    Object.assign(requestBody, {
                        task_type: currentDataType, 
                        sido: sidoParam,
                        startYear: startYear,
                        startMonth: startMonth,
                        endYear: endYear,
                        endMonth: endMonth
                    });
                    break;
                case 'rediscache':
                    apiUrl = '/front/back/admin/trigger_cache_batch.php';
                    Object.assign(requestBody, {
                        task_type: currentDataType, 
                        sido: sidoParam
                    });
                    break;
                case 'realpriceAverage':
                    apiUrl = '/front/back/admin/trigger_average_batch.php'; // ✨ 새로운 마스터 스크립트 호출 ✨
                    Object.assign(requestBody, {
                        // 이 파라미터들은 마스터 스크립트를 통해 워커 스크립트로 전달됩니다.
                        task_type: currentDataType, // task_type은 마스터 스크립트가 내부적으로 'realpriceAverageMaster' 등으로 처리할 수 있습니다.
                        baseYear: baseYear,
                        baseMonth: baseMonth,
                        sido: "ALL"
                    });
                    break;
                default:
                    alert("알 수 없는 업로드 유형입니다.");
                    $(this).prop('disabled', false).text(getUploadStartBtnText(currentDataType));
                    return;
            }

            try {
                // 시작 전에 이전 로그를 지우고 진행 상태를 '처리 중'으로 변경 (파일 기반은 바로 로그 업데이트될 것)
                batchLogViewer_redisTab.innerHTML = '처리 중...';
                currentStatusSpan.textContent = '처리 중';

                const absoluteApiUrl = window.location.protocol + '//' + window.location.host + apiUrl;
                
                const response = await fetch(absoluteApiUrl, { // ===>>> 여기 absoluteApiUrl 사용 <<<===
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });
                
                // HTTP 응답 자체에 문제가 있었는지 확인 (예: 404, 500)
                if (!response.ok) {
                    throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();

                if (result.success) {
                    const logMessage = `[${new Date().toLocaleString()}] ${currentDataType} 작업 시작 요청 성공: ${result.message}`;
                    batchLogViewer_redisTab.innerHTML = logMessage;
                    lastLogLineCount = 1;
                    batchLogViewer_redisTab.scrollTop = batchLogViewer_redisTab.scrollHeight;
                    
                    // ===>>> 여기에 최신 이력 목록을 불러와 화면을 새로 그려주는 함수 호출 <<<===
                    // 이력 테이블을 업데이트하는 함수가 'rediscache' 타입에 대해 initHistoryViewRealcache(10, 0); 인 것으로 보입니다.
                    // 현재는 작업 완료 시에만 호출되는데, 시작 시에도 호출하여 목록을 갱신합니다.
                    historyTablerefresh(currentDataType);
                                        // ===>>> 이 부분이 핵심 수정: result.batch_id 대신 result.master_history_id 사용 <<<===
                    startBatchPolling(result.master_history_id); // API 응답의 master_history_id를 인자로 전달
                    
                } else {
                    // result.success가 false인 경우 (백엔드 로직상 실패)
                    const errorMsg = `[${new Date().toLocaleString()}] ${currentDataType} 작업 요청 실패: ${result.message || '알 수 없는 오류'}`;
                    batchLogViewer_redisTab.innerHTML += `\n${errorMsg}`;
                    currentStatusSpan.textContent = '요청 실패';
                    $(this).prop('disabled', false).text(getUploadStartBtnText(activeTaskType)); // 버튼 활성화
                    //console.error(`Batch trigger for ${currentDataType} failed (backend reported failure):`, result.message);
                }
                
            } catch (error) {
                // fetch 자체의 오류 (네트워크, Mixed Content 등) 또는 JSON 파싱 오류
                const errorMsg = `[${new Date().toLocaleString()}] 서버 통신 중 오류 발생: ${error.message}`;
                batchLogViewer_redisTab.innerHTML += `\n${errorMsg}`;
                currentStatusSpan.textContent = '요청 오류';
                $(this).prop('disabled', false).text(getUploadStartBtnText(activeTaskType)); // 버튼 활성화
                //console.error(`Batch trigger for ${currentDataType} failed (client-side error):`, error);
            } finally {
                loadInitialBatchStatus(currentDataType); // 상태 초기화 재호출
            }
        });

        // ===>>> 중단 버튼 클릭 이벤트 핸들러 <<<===
        $(cancelBatchBtn).on('click', async function() {
            const currentDataType = activeTaskType;
            if (!currentBatchId) {
                alert('취소할 진행 중인 배치 작업이 없습니다.');
                return;
            }

            if (!confirm(`배치 작업 (ID: ${currentBatchId})을(를) 정말로 취소하시겠습니까?`)) {
                return;
            }

            try {
                cancelBatchBtn.prop('disabled', true).text('취소 중...'); // 버튼 비활성화
                const response = await fetch('/front/back/admin/cancel_batch.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ history_id: currentBatchId, user_id: 'admin' }) // 'admin'은 예시, 실제 사용자 ID를 전달 가능
                });
                const result = await response.json();

                if (result.success) {
                    alert(result.message);
                    // 취소 요청 성공 후, 폴링은 계속 진행되어 'canceled' 상태를 감지할 것임
                    // 화면 갱신은 fetchBatchProgress가 'canceled' 상태를 처리할 때 이루어짐.
                } else {
                    alert('취소 요청 실패: ' + result.message);
                }
            } catch (error) {
                console.error('배치 취소 API 호출 중 오류 발생:', error);
                alert('배치 취소 중 통신 오류가 발생했습니다.');
            } finally {
                cancelBatchBtn.prop('disabled', false).text('중단'); // 버튼 다시 활성화
            }
            loadInitialBatchStatus(currentDataType); // 상태 초기화 재호출
        });

        // Redis 로그 새로고침 버튼 클릭 이벤트
        if (refreshLogBtn_redisTab) {
            refreshLogBtn_redisTab.addEventListener('click', async function() {
                const currentDataType = activeTaskType;
                // 1. 현재 진행 중인 배치 작업의 상태 및 로그를 새로고침
                if (currentBatchId) {
                    // fetchBatchProgress 함수가 있다면, 해당 함수를 호출하여 로그를 업데이트
                    // (fetchBatchProgress가 현재 배치 ID에 대한 최신 로그를 가져오고 상태를 갱신합니다)
                    // updateLogOnly 인자를 false로 주면, 상태 변화에 따라 initHistoryViewRealcache도 호출될 수 있습니다.
                    await fetchBatchProgress(currentBatchId, false);

                } else {
                    // 진행 중인 작업이 없다면, 로그 뷰어를 초기화하거나 비움
                    batchLogViewer_redisTab.innerHTML = '현재 조회할 배치 작업 ID가 없습니다. 먼저 작업을 시작해주세요.';
                    lastLogLineCount = 0;
                }

                historyTablerefresh(currentDataType);
            });
        }
    } // --- initEvents 끝 ---


    // ===============================================================
    // 배치 상태 및 로그를 가져와 UI를 업데이트하는 핵심 함수
    // ===============================================================
    async function fetchBatchProgress(historyId, forceRefresh = false) {
        if (!historyId) return;

        try {
            // PHP API 엔드포인트는 /front/back/admin/get_batch_progress.php 로 가정합니다.
            const response = await fetch(`/front/back/admin/get_batch_progress.php?history_id=${historyId}`);
            
            const data = await response.json();

            if (data.success) {
                currentStatusSpan.textContent = data.status_text;
                lastRunTimeSpan.textContent = data.lastRunTime;
                lastCompletionTimeSpan.textContent = data.lastCompletionTime;

                // 모든 관련 로그 (마스터 + 하위)를 시간순으로 표시
                if (data.all_logs && data.all_logs.length > 0) {
                    // 로그를 히스토리 ID와 레벨을 함께 표시하도록 변경
                    const formattedLogs = data.all_logs.map(log => {
                        const logPrefix = (log.history_id === parseInt(historyId)) ? '[마스터]' : `[ID:${log.history_id}]`;
                        return `${logPrefix}[${log.timestamp}][${log.level}] ${log.message}`;
                    }).join('\n');

                    if (forceRefresh) {
                        batchLogViewer_redisTab.innerHTML = formattedLogs;
                        lastLogLineCount = data.all_logs.length;
                    } else {
                        // 새로 추가된 로그만 효율적으로 추가
                        const newLogs = data.all_logs.slice(lastLogLineCount);
                        if (newLogs.length > 0) {
                            newLogs.forEach(log => {
                                const logPrefix = (log.history_id === parseInt(historyId)) ? '[마스터]' : `[ID:${log.history_id}]`;
                                batchLogViewer_redisTab.innerHTML += `\n${logPrefix}[${log.timestamp}][${log.level}] ${log.message}`;
                            });
                            lastLogLineCount = data.all_logs.length;
                        }
                    }
                    // ===>>> 이 부분이 자동 스크롤 코드입니다 <<<===
                    // batchLogViewer_redisTab이 jQuery 객체라면, 다음과 같이 .prop()를 사용하거나 네이티브 요소에 접근해야 합니다.
                    if (batchLogViewer_redisTab.length) { // jQuery 객체일 경우 length 속성으로 존재하는지 확인
                        batchLogViewer_redisTab.scrollTop(batchLogViewer_redisTab.prop('scrollHeight'));
                    } else if (batchLogViewer_redisTab) { // 일반 DOM 요소일 경우
                        batchLogViewer_redisTab.scrollTop = batchLogViewer_redisTab.scrollHeight;
                    }
                } else if (forceRefresh) {
                    batchLogViewer_redisTab.innerHTML = '현재 표시할 로그가 없습니다.';
                    lastLogLineCount = 0;
                }

                // 작업이 완료 또는 실패하면 폴링 중단 (마스터 작업의 상태 기준)
                if (data.master_status === 'success' || data.master_status === 'failed' || data.master_status === 'canceled') {
                    if (batchStatusInterval) {
                        clearInterval(batchStatusInterval);
                        batchStatusInterval = null;
                    }
                    // ===>>> 완료/실패/취소 시 중단 버튼 숨김 및 시작 버튼 활성화 <<<===
                    cancelBatchBtn.hide(); 
                    // 모든 작업 유형에 대해 이력 테이블을 업데이트
                    historyTablerefresh(activeTaskType);
                    
                    $(uploadStartBtn_main).prop('disabled', false).text( getUploadStartBtnText(activeTaskType));
                } else {
                    $(uploadStartBtn_main).prop('disabled', true).text('처리 중...'); // 처리 중일 때는 버튼 비활성화 유지
                    // ===>>> 처리 중일 때는 중단 버튼 표시 유지 <<<===
                    cancelBatchBtn.show(); 
                }

            } else {
                //console.error('배치 진행 상황 조회 실패:', data.message);
                batchLogViewer_redisTab.innerHTML += `\n[오류] 배치 진행 상황 조회 실패: ${data.message}`;
                if(batchStatusInterval) clearInterval(batchStatusInterval);
                batchStatusInterval = null;
                cancelBatchBtn.hide(); // 오류 발생 시 중단 버튼 숨김
                $(uploadStartBtn_main).prop('disabled', false).text(getUploadStartBtnText(activeTaskType));
            }
        } catch (error) {
            //console.error('배치 상태 폴링 중 오류 발생:', error);
            batchLogViewer_redisTab.innerHTML += `\n[오류] 서버 통신 중 오류 발생: ${error.message}`;
            if(batchStatusInterval) clearInterval(batchStatusInterval);
            batchStatusInterval = null;
            cancelBatchBtn.hide(); // 오류 발생 시 중단 버튼 숨김
            $(uploadStartBtn_main).prop('disabled', false).text(getUploadStartBtnText(activeTaskType));
        }
    }

    function historyTablerefresh(dataType) {
        if (dataType === 'characteristic') {
            initHistoryViewCharacter(10, 0);
        } else if (dataType === 'realprice') {
            initHistoryViewRealPrice(10, 0);
        } else if (dataType === 'rediscache') {
            initHistoryViewRealcache(10, 0);
        } else if (dataType === 'realpriceAverage') {
            initHistoryViewRealAverage(10, 0);
        }
    }

    function getUploadStartBtnText(taskType) {
        let buttonText = '시작 버튼';
        if (taskType === 'characteristic') {
            buttonText = '토지 특성 정보를 Redis 캐시에 업로드 시작';
        } else if (taskType === 'realprice') {
            buttonText = '국토교통부에서 실거래가 데이터를 가져오기 시작';
        } else if (taskType === 'rediscache') {
            buttonText = '실거래가(읍면동 단위)를 Redis 캐시에 업로드 시작';
        } else if (taskType === 'realpriceAverage') {
        }   buttonText = '실거래 평균가를 테이블에 업데이트 시작';
        return buttonText;
    }

    function getHistoryTitle(taskType) {
        let title = '';
        switch (taskType) {
            case 'characteristic':
                title = '[토지 특성 정보 Redis 캐시 업로드 이력]';
                break;
            case 'realprice':
                title = '[국토교통부 실거래가 가져오기 이력]';
                break;
            case 'rediscache':
                title = '[실거래가 정보 Redis 캐시 업로드 이력]';
                break;
            case 'realpriceAverage':
                title = '[실거래 평균가를 테이블에 업데이트 이력]';
                break;
        }
        return title;
    }
    // ===============================================================
    // 배치 상태 폴링 시작 (전역 currentBatchId 변수를 사용하여 setInterval 클로저가 이 전역 변수를 참조)
    // ===============================================================
    function startBatchPolling(initialBatchId) {
        stopBatchPolling(); // 기존 폴링 중단

        lastLogLineCount = 0;

        // currentBatchId를 전역 변수에서 초기화
        currentBatchId = initialBatchId;

        if (!currentBatchId) { // 유효한 ID가 없으면 폴링 시작하지 않음
            //console.error("No valid batch ID to start polling.");
            cancelBatchBtn.hide(); 
            return;
        }

        // ===>>> 배치 작업 시작 시 중단 버튼 표시 <<<===
        cancelBatchBtn.show(); 
        uploadStartBtn_main.prop('disabled', true); // 시작 버튼 비활성화
        // 초기 로딩 후 바로 한번 가져옴 (Interval 시작 전에)
        fetchBatchProgress(currentBatchId, false); // forceRefresh 기본값 false

        // setInterval을 사용하여 주기적으로 가져옴
        batchStatusInterval = setInterval(() => {
            fetchBatchProgress(currentBatchId, false); // forceRefresh 기본값 false
        }, 5000);
    }

    function stopBatchPolling() {
        if (batchStatusInterval) { // batchStatusInterval 변수에 ID가 저장되어 있다면
            clearInterval(batchStatusInterval); // setInterval을 해제합니다.
            batchStatusInterval = null; // 인터벌 ID를 초기화하여 폴링이 중단되었음을 표시합니다.
        }
    }


    // ===============================================================
    // 이력 렌더링 함수들
    // ===============================================================

    async function getAndRenderHistory(taskType, limit, offset) {
        const batchHistorySectionContent = $('#batchhistory'); 
        batchHistorySectionContent.html('<p>이력 데이터를 로드 중입니다...</p>');
        try {
            const response = await fetch(`/front/back/admin/get_upload_history.php?task_type=${taskType}&limit=${limit}&offset=${offset}`);
            const result = await response.json();
            if (result.success) {
                let theadHtml = `
                    <tr>
                        <th>ID</th>
                        <th>유형</th>
                        <th>대상 시도</th>
                        <th>수집 시작(년월)</th>
                        <th>수집(기준) 종료(년월)</th>
                        <th>시작 시간</th>
                        <th>종료 시간</th>
                        <th>상태</th>
                        <th>메시지</th>
                    </tr>`;
                let tbodyHtml = '';

                result.data.forEach(masterItem => { // 마스터 이력 순회
                    let statusColor = '';
                    switch (masterItem.status) {
                        case 'success': statusColor = 'text-success'; break; // completed -> success
                        case 'failed': statusColor = 'text-danger'; break;
                        case 'processing': statusColor = 'text-primary'; break;
                        case 'canceled': statusColor = 'text-warning'; break; // 취소 상태 추가
                        default: statusColor = ''; break;
                    }
    
                    // 마스터 작업 행 추가
                    tbodyHtml += `
                        <tr class="master-row">
                            <td>${masterItem.id}</td>
                            <td>${masterItem.task_type}</td>
                            <td>${masterItem.sido_param}</td>
                            <td>${masterItem.start_year_month|| '-'} </td>
                            <td>${masterItem.end_year_month || '-'}</td>
                            <td>${masterItem.started_at || '-'}</td>
                            <td>${masterItem.finished_at || '-'}</td>
                            <td class="${statusColor}">${masterItem.status_text}</td>
                            <td>${masterItem.log_message_summary || '-'}</td>
                        </tr>`;
    
                    // 해당 마스터 작업의 하위 작업들 추가
                    masterItem.child_tasks.forEach(childItem => {
                        let childStatusColor = '';
                        switch (childItem.status) {
                            case 'success': childStatusColor = 'text-success'; break;
                            case 'failed': childStatusColor = 'text-danger'; break;
                            case 'processing': childStatusColor = 'text-primary'; break;
                            case 'canceled': childStatusColor = 'text-warning'; break;
                            default: childStatusColor = ''; break;
                        }
    
                        tbodyHtml += `
                            <tr class="child-row">
                                <td class="child-id">${childItem.id}</td>
                                <td>${childItem.task_type}</td>
                                <td><span class="child-sido">${childItem.sido_param}</span></td>
                                <td>${childItem.start_year_month || '-'}</td>
                                <td>${childItem.end_year_month || '-'}</td>
                                <td>${childItem.started_at || '-'}</td>
                                <td>${childItem.finished_at || '-'}</td>
                                <td class="${childStatusColor}">${childItem.status_text}</td>
                                <td>${childItem.log_message_summary || '-'}</td>
                            </tr>`;
                    });
                });

                let title = '';
                const historyTitle = document.getElementById('historyTitle');
                title = getHistoryTitle(taskType);
                if (historyTitle) historyTitle.textContent = title;

                // 최종 렌더링
                batchHistorySectionContent.html(`
                    <table id="history_view_${taskType}" class="table table-nowrap">
                        <thead>${theadHtml}</thead>
                        <tbody>${tbodyHtml}</tbody>
                    </table>
                    <style> /* CSS 추가: 하위 항목 들여쓰기 */
                        .master-row td { font-weight: bold; } /* 마스터 행 강조 */
                        .child-row { background-color: #f8f9fa; } /* 배경색으로 구분 */
                        .child-id { padding-left: 20px; } /* 왼쪽 패딩으로 들여쓰기 효과 */
                        .child-sido { font-weight: normal; } /* 하위 시도는 기본 */
                    </style>
                `);
            } else {
                //console.error(`[getAndRenderHistory] Failed to load ${taskType} history:`, result.message);
                batchHistorySectionContent.html(`<p class="text-danger">이력 로드 실패: ${result.message}</p>`);
                //console.error(`Failed to load ${taskType} history:`, result.message);
            }
        } catch (error) {
            //console.error(`[getAndRenderHistory] Error fetching ${taskType} history:`, error);
            batchHistorySectionContent.html(`<p class="text-danger">이력 로드 중 오류 발생: ${error.message}</p>`);
            //console.error(`Error fetching ${taskType} history:`, error);
        }
    }

    async function initHistoryViewCharacter(limit, offset) {
        await getAndRenderHistory('characteristic', limit, offset);
    }

    async function initHistoryViewRealPrice(limit, offset) {
        await getAndRenderHistory('realprice', limit, offset);
    }

    async function initHistoryViewRealcache(limit, offset) {
        await getAndRenderHistory('rediscache', limit, offset); 
    }

    async function initHistoryViewRealAverage(limit, offset) {
        await getAndRenderHistory('realpriceAverage', limit, offset); 
    }

}); // $(document).ready 끝
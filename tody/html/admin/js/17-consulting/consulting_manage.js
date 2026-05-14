/* ============================================================
 * 부동산 개발 컨설팅 신청 목록
 * ============================================================ */

const CONSULTING_STATUS_LABEL = {
    received:    '수신',
    read:        '열람완료',
    in_progress: '진행중',
    done:        '완료',
    rejected:    '거부',
};

const CONSULTING_STATUS_BADGE = {
    received:    'bg-info-subtle text-info',
    read:        'bg-secondary-subtle text-secondary',
    in_progress: 'bg-warning-subtle text-warning',
    done:        'bg-success-subtle text-success',
    rejected:    'bg-danger-subtle text-danger',
};

const CONSULTING_PURPOSE_LABEL = {
    feasibility: '사업타당성 분석',
    devpermit:   '개발행위허가 검토',
    district:    '지구단위계획사업 검토',
    tourism:     '관광농원·관광휴양단지',
    housing:     '주택건설사업 검토',
    industrial:  '산업단지개발사업 검토',
    urban:       '도시개발사업 검토',
    other:       '기타 토지 개발',
};

let consultingTable = null;

$(document).ready(function () {
    initializeDataTable();

    $('#statusFilter').on('change', function () {
        consultingTable.ajax.reload();
    });

    $(document).on('click', '.delete-btn', function () {
        const no = $(this).data('no');
        inquiryDelete(no);
    });
});

function initializeDataTable() {
    consultingTable = new DataTable('#ajax-datatables', {
        language: { url: '/assets/libs/datatables/lang/ko.json' },
        scrollX: true,
        processing: true,
        destroy: true,
        ajax: function (data, callback) {
            loadTableData(callback);
        },
        columns: [
            { data: 'no',             title: 'No' },
            { data: 'purpose_label',  title: '개발목적' },
            { data: 'name',           title: '성명' },
            { data: 'phone',          title: '연락처' },
            { data: 'location',       title: '소재지' },
            { data: 'area',           title: '면적', orderable: false },
            { data: 'status_badge',   title: '상태', orderable: false },
            { data: 'reg_date',       title: '접수일시' },
            { data: 'email_sent_at',  title: '메일발신' },
            { data: 'management',     title: '관리', orderable: false, searchable: false },
        ],
        order: [],
        columnDefs: [
            { className: 'text-center align-middle', targets: [0, 5, 6, 9] },
            { className: 'text-start align-middle',  targets: [1, 2, 3, 4, 7, 8] },
        ],
    });
}

function loadTableData(callback) {
    const status = $('#statusFilter').val() || '';
    const params = { ...adminUserInfo(), status: encodeURIComponent(status) };

    callApi('POST', '/admin/back/17-consulting/inquiry_list.php', params, 'noLoading')
        .then((res) => {
            if (!res || !res.responseData) {
                if (callback) callback({ data: [] });
                return;
            }
            const rows = res.responseData.map((row) => {
                const purposeLabel = CONSULTING_PURPOSE_LABEL[row.purpose] || row.purpose;
                const statusLabel  = CONSULTING_STATUS_LABEL[row.status]   || row.status;
                const badgeCls     = CONSULTING_STATUS_BADGE[row.status]   || 'bg-light text-dark';
                const statusBadge  = `<span class="badge ${badgeCls}">${statusLabel}</span>`;
                const mailIcon     = row.email_sent_at
                    ? row.email_sent_at
                    : '<span class="text-danger">미발송</span>';

                const management = `
                    <div class="dropdown d-inline-block">
                        <button class="btn btn-soft-secondary btn-sm dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="ri-more-fill align-middle"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <a href="/admin/views/consulting_manage/consulting_manage_detail.html?no=${row.no}" class="dropdown-item">
                                    <i class="ri-eye-fill align-bottom me-2 text-muted"></i>상세
                                </a>
                            </li>
                            <li>
                                <button type="button" data-no="${row.no}" class="delete-btn dropdown-item">
                                    <i class="ri-delete-bin-fill align-bottom me-2 text-muted"></i>삭제
                                </button>
                            </li>
                        </ul>
                    </div>
                `;

                return {
                    no:            row.no,
                    purpose_label: purposeLabel,
                    name:          row.name     || '-',
                    phone:         row.phone    || '-',
                    location:      row.location || '-',
                    area:          row.area     || '-',
                    status_badge:  statusBadge,
                    reg_date:      row.reg_date || '-',
                    email_sent_at: mailIcon,
                    management:    management,
                };
            });

            if (callback) callback({ data: rows });
        })
        .catch((err) => {
            console.error('컨설팅 신청 목록 로드 실패:', err);
            if (callback) callback({ data: [] });
        });
}

async function inquiryDelete(no) {
    const ok = await sweetConfirm('삭제 하시겠습니까?', '', 'w');
    if (!ok) return;

    const params = { ...adminUserInfo(), rcvNo: no };
    const res = await callApi('POST', '/admin/back/17-consulting/inquiry_delete.php', params);
    if (!res) return;

    if (res.message === 'SUCCESS') {
        await sweetAlertForReturn('삭제 되었습니다.', '', 's');
        consultingTable.ajax.reload(null, false);
    } else {
        await sweetAlertForReturn('삭제에 실패했습니다.', '', 'e');
    }
}

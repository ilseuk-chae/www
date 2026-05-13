/* ============================================================
 * 구매대행 문의 상세
 * ============================================================ */

const PURCHAS_TYPE_LABEL = {
    purchas: '구매대행',
    credit:  '구매대행(신용)',
    other:   '기타',
};
const PURCHAS_BUDGET_LABEL = {
    under1: '1억 미만',
    '1to5': '1억 ~ 5억',
    '5to10': '5억 ~ 10억',
    over10: '10억 이상',
};

function getNoFromUrl() {
    const params = new URLSearchParams(location.search);
    return parseInt(params.get('no') || '0', 10);
}

function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

$(document).ready(async function () {
    const no = getNoFromUrl();
    if (!no) {
        await sweetAlertForReturn('잘못된 접근입니다.', '', 'e');
        location.href = '/admin/views/purchas_manage/purchas_manage.html';
        return;
    }

    await loadDetail(no);

    $('#btnStatusSave').on('click', () => saveStatus(no));
    $('#btnMemoSave').on('click',   () => saveMemo(no));
});

async function loadDetail(no) {
    const params = { ...adminUserInfo(), no: no };
    const res = await callApi('POST', '/admin/back/16-todypurchas/inquiry_info.php', params);
    if (!res || !res.responseData) {
        await sweetAlertForReturn('상세 정보를 불러오지 못했습니다.', '', 'e');
        return;
    }
    const d = res.responseData;

    $('#d_no').text(d.no);
    $('#d_type').text(PURCHAS_TYPE_LABEL[d.type] || d.type || '-');
    $('#d_name').text(d.name || '-');
    $('#d_company').text(d.company || '-');
    $('#d_phone').text(d.phone || '-');
    $('#d_location').text(d.location || '-');
    $('#d_budget').text(PURCHAS_BUDGET_LABEL[d.budget] || d.budget || '-');
    $('#d_message').text(d.message || '-');
    $('#d_reg_date').text(d.reg_date || '-');
    $('#d_email_sent_at').html(
        d.email_sent_at
            ? escapeHtml(d.email_sent_at)
            : '<span class="text-danger">미발송</span>'
    );
    $('#d_completed_at').text(d.completed_at || '-');
    $('#d_ip').text(d.ip_address || '-');

    $('#statusSelect').val(d.status || 'received');
    $('#adminMemo').val(d.admin_memo || '');

    // 첨부파일
    const $ul = $('#d_files').empty();
    if (!d.files || d.files.length === 0) {
        $ul.append('<li class="list-group-item text-muted">첨부파일이 없습니다.</li>');
    } else {
        d.files.forEach((f) => {
            const li = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <i class="ri-attachment-2 me-2 text-muted"></i>
                        <span>${escapeHtml(f.original_name)}</span>
                        <small class="text-muted ms-2">(${formatSize(f.file_size)})</small>
                    </div>
                    <button type="button" class="btn btn-sm btn-soft-primary file-download-btn" data-file="${f.file_no}">
                        <i class="ri-download-2-line align-bottom me-1"></i>다운로드
                    </button>
                </li>
            `;
            $ul.append(li);
        });
    }

    $(document).off('click', '.file-download-btn').on('click', '.file-download-btn', function () {
        const fileNo = $(this).data('file');
        downloadFile(fileNo);
    });
}

function downloadFile(fileNo) {
    // authChk는 POST 기반이라 form POST로 호출
    const info = adminUserInfo();
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/admin/back/16-todypurchas/inquiry_file_download.php';
    form.target = '_blank';

    const addInput = (name, value) => {
        const inp = document.createElement('input');
        inp.type = 'hidden';
        inp.name = name;
        inp.value = value;
        form.appendChild(inp);
    };
    Object.keys(info).forEach((k) => addInput(k, info[k]));
    addInput('file_no', fileNo);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}

async function saveStatus(no) {
    const status = $('#statusSelect').val();
    const ok = await sweetConfirm('상태를 변경하시겠습니까?', '', 'q');
    if (!ok) return;

    const params = { ...adminUserInfo(), rcvNo: no, status: encodeURIComponent(status) };
    const res = await callApi('POST', '/admin/back/16-todypurchas/inquiry_status_change.php', params);
    if (!res) return;

    if (res.message === 'SUCCESS') {
        await sweetAlertForReturn('저장되었습니다.', '', 's');
        loadDetail(no);
    } else {
        await sweetAlertForReturn('상태 변경에 실패했습니다.', '', 'e');
    }
}

async function saveMemo(no) {
    const memo = $('#adminMemo').val();
    const params = { ...adminUserInfo(), rcvNo: no, admin_memo: encodeURIComponent(memo) };
    const res = await callApi('POST', '/admin/back/16-todypurchas/inquiry_memo_update.php', params);
    if (!res) return;

    if (res.message === 'SUCCESS') {
        await sweetAlertForReturn('메모가 저장되었습니다.', '', 's');
    } else {
        await sweetAlertForReturn('메모 저장에 실패했습니다.', '', 'e');
    }
}

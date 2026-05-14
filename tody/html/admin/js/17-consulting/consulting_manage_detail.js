/* ============================================================
 * 부동산 개발 컨설팅 신청 상세
 * ============================================================ */

const CONSULTING_PURPOSE_LABEL = {
    feasibility: '사업타당성 분석',
    devpermit:   '개발행위허가 검토',
    district:    '지구단위계획사업 검토',
    tourism:     '관광농원 및 관광휴양단지 사업 검토',
    housing:     '주택건설사업 검토',
    industrial:  '산업단지개발사업 검토',
    urban:       '도시개발사업 검토',
    other:       '기타 토지 개발 사업 검토',
};

function getNoFromUrl() {
    const params = new URLSearchParams(location.search);
    return parseInt(params.get('no') || '0', 10);
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
        location.href = '/admin/views/consulting_manage/consulting_manage.html';
        return;
    }

    await loadDetail(no);

    $('#btnStatusSave').on('click', () => saveStatus(no));
    $('#btnMemoSave').on('click',   () => saveMemo(no));
});

async function loadDetail(no) {
    const params = { ...adminUserInfo(), no: no };
    const res = await callApi('POST', '/admin/back/17-consulting/inquiry_info.php', params);
    if (!res || !res.responseData) {
        await sweetAlertForReturn('상세 정보를 불러오지 못했습니다.', '', 'e');
        return;
    }
    const d = res.responseData;

    $('#d_no').text(d.no);
    $('#d_purpose').text(CONSULTING_PURPOSE_LABEL[d.purpose] || d.purpose || '-');
    $('#d_location').text(d.location || '-');
    $('#d_area').text(d.area || '-');
    $('#d_name').text(d.name || '-');
    $('#d_phone').text(d.phone || '-');
    $('#d_message').text(d.message || '-');
    $('#d_reg_date').text(d.reg_date || '-');
    $('#d_email_sent_at').html(
        d.email_sent_at
            ? escapeHtml(d.email_sent_at)
            : '<span class="text-danger">미발송</span>'
    );
    $('#d_updated_at').text(d.updated_at || '-');
    $('#d_ip').text(d.ip_address || '-');

    $('#statusSelect').val(d.status || 'received');
    $('#adminMemo').val(d.admin_memo || '');
}

async function saveStatus(no) {
    const status = $('#statusSelect').val();
    const ok = await sweetConfirm('상태를 변경하시겠습니까?', '', 'q');
    if (!ok) return;

    const params = { ...adminUserInfo(), rcvNo: no, status: encodeURIComponent(status) };
    const res = await callApi('POST', '/admin/back/17-consulting/inquiry_status_change.php', params);
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
    const res = await callApi('POST', '/admin/back/17-consulting/inquiry_memo_update.php', params);
    if (!res) return;

    if (res.message === 'SUCCESS') {
        await sweetAlertForReturn('메모가 저장되었습니다.', '', 's');
    } else {
        await sweetAlertForReturn('메모 저장에 실패했습니다.', '', 'e');
    }
}

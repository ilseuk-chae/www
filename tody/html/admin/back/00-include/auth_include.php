<?php

function authChk($conn, $user_no, $user_token, $cont_no, $cont_token)
{
    $hash_user_no = $user_no;
    //전달받은 cont_no 를 이용하여 cont_token 값을 서버로부터 전달받기 위해 쿼리를 구성한다.
    $sql = "SELECT " . $cont_no . " as cont_no, EBGA_CREATE_PW_SHA('" . $cont_no . "') as cont_token";
    $rs_query = mysqli_query($conn, $sql);

    //질의 전송 결과 값이 없으면, cont_no 가 숫자가 아닌 값 또는 빈값일 경우이다.
    if (!$rs_query) {
        return "CONT_NO_INCORRECT";
    }

    //질의 전송 결과 값을 배열로 패치한다.
    $rs = mysqli_fetch_assoc($rs_query);

    //배열값중, 서버로부터 암호화되어 반환받은 토큰을 변수에 저장한다.
    $cont_token_compare = $rs['cont_token'];

    //질의 전송 결과 값을 메모리에서 해제한다.
    mysqli_free_result($rs_query);

    //전달받은 cont_token 과 서버로부터 전달받은 cont_toekn_compare 를 비교하여 분기한다.
    if ($cont_token_compare == $cont_token) {

        //전달받은 user_no 에서 가장 최근에 발급된 최신 cont_no 를 서버로부터 전달받기 위해 쿼리를 구성한다.
        $sql = "SELECT ifnull(max(cont_no),0) as cont_no_max from eb_sa_page_contact_log where SHA2(session_id_name, 256) = '{$hash_user_no}'";
        // echo $sql;
        // exit;
        $rs_query = mysqli_query($conn, $sql);

        //질의 전송 결과 값이 없을수 없지만 예외처리한다.
        if (!$rs_query) {
            return "NOT_REALIZED";
        }

        //질의 전송 결과 값을 배열로 패치한다.
        $cont_no_ok = mysqli_fetch_assoc($rs_query);

        //전달받은 cont_no_max 값을 변수에 저장한다.
        $cont_no_max = $cont_no_ok['cont_no_max'];

        //변수를 정수화 한다.
        $cont_no_max = (int) $cont_no_max;

        //전달받은 cont_no 또한 정수화 한다.
        $cont_no = (int) $cont_no;

        //질의 전송 결과 값을 메모리에서 해제한다.
        mysqli_free_result($rs_query);
    } else {
        return "CONT_TOKEN_INCORRECT";
    }

    //이번 접근이 가장 최신의 접근인지 여부를 판단하여 분기한다.
    if ($cont_no_max <= $cont_no) {

        //전달받은 hash_user_no 로부터 user_token 값을 서버로부터 전달받는다.
        $sql = "SELECT EBGA_CREATE_PW_SHA('" . $hash_user_no . "') as token";
        $rs_query = mysqli_query($conn, $sql);

        //질의 전송 결과 값이 없으면, hash_user_no 가 빈값이거나, 숫자가 아닌값인 경우이다.
        if (!$rs_query) {
            return "USER_NO_INCORRECT";
        }

        //질의 전송 결과 값을 배열화한다.
        $rs_token = mysqli_fetch_assoc($rs_query);

        //배열에서 서버로부터 전달받은 토근 값을 변수에 저장한다.
        $token_compare = $rs_token['token'];

        //벼열을 메모리 해제한다.
        mysqli_free_result($rs_query);
    } else {
        return "CONT_NO_INCORRECT";
    }

    //token_compare 값과 user_token 값을 비교한다.
    if ($token_compare == $user_token) {

        return "ACCESS";
    } else {
        return "TOKEN_INCORRECT";
    }
} 
<?php

header("Access-Control-Allow-Headers: X-Requested-With, X-Prototype-Version");
header("Content-Type:text/html;charset=utf-8");

require_once $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
$dotenv->load();

// PgSql 어댑터 로드 (파일이 없으면 즉시 정의)
$adapterPath = __DIR__ . '/PostgrePdoAdapter.php';
if (file_exists($adapterPath)) {
    require_once $adapterPath;
} else {
    if (!class_exists('PgSqlStatementAdapter')) {
        class PgSqlStatementAdapter
        {
            private $connection;
            private $sql;
            private $result;

            public function __construct($connection, string $sql)
            {
                $this->connection = $connection;
                $this->sql = $sql;
                $this->result = null;
            }

            public function execute(array $params = []): bool
            {
                [$preparedSql, $orderedParams] = $this->prepareParams($this->sql, $params);

                if (!empty($orderedParams)) {
                    $this->result = @pg_query_params($this->connection, $preparedSql, array_values($orderedParams));
                } else {
                    $this->result = @pg_query($this->connection, $preparedSql);
                }

                if ($this->result === false) {
                    $error = function_exists('pg_last_error') ? pg_last_error($this->connection) : 'PostgreSQL query failed';
                    throw new Exception($error);
                }

                return true;
            }

            public function fetch($mode = null)
            {
                if (!$this->result) {
                    return false;
                }

                $row = pg_fetch_assoc($this->result);
                return $row !== false ? $row : false;
            }

            public function fetchAll($mode = null): array
            {
                if (!$this->result) {
                    return [];
                }

                $rows = [];
                while ($row = pg_fetch_assoc($this->result)) {
                    $rows[] = $row;
                }

                return $rows;
            }

            public function closeCursor(): void
            {
                if ($this->result) {
                    pg_free_result($this->result);
                    $this->result = null;
                }
            }

            private function prepareParams(string $sql, array $params): array
            {
                if (empty($params)) {
                    return [$sql, []];
                }

                $orderedValues = [];
                $index = 1;

                foreach ($params as $name => $value) {
                    $placeholder = ':' . ltrim($name, ':');
                    $pattern = '/' . preg_quote($placeholder, '/') . '(?=[^A-Za-z0-9_]|$)/';
                    $replacement = '$' . $index;
                    $count = 0;
                    $sql = preg_replace($pattern, $replacement, $sql, -1, $count);

                    if ($count === 0) {
                        throw new Exception("Placeholder {$placeholder} not found in SQL.");
                    }

                    $orderedValues[] = $value;
                    $index++;
                }

                return [$sql, $orderedValues];
            }
        }
    }

    if (!class_exists('PgSqlPdoAdapter')) {
        class PgSqlPdoAdapter
        {
            private $connection;

            public function __construct($connection)
            {
                $this->connection = $connection;
            }

            public function prepare(string $sql): PgSqlStatementAdapter
            {
                return new PgSqlStatementAdapter($this->connection, $sql);
            }

            public function setAttribute($attribute, $value): void
            {
                // 유지 목적: PDO 인터페이스 호환
            }
        }
    }
}

$host_postgre = $_ENV['postgre_host'];
$port_postgre = $_ENV['postgre_port'];
$dbname_postgre = $_ENV['postgre_database'];
$user_postgre = $_ENV['postgre_user'];
$password_postgre = $_ENV['postgre_password'];

$pdo = null;
$pgsqlConnection = null;

// // 연결 문자열
// $conn_string = "host=$host_postgre port=$port_postgre dbname=$dbname_postgre user=$user_postgre password=$password_postgre";

// // 연결 시도
// $conn_postgre = pg_connect($conn_string);

// if (!$conn_postgre) {
//     echo "PostgreSQL 연결 실패!";
//     exit;
// } else {
//     // echo "PostgreSQL 연결 성공!";
// }

try {
    $pdoDrivers = class_exists('PDO') ? PDO::getAvailableDrivers() : [];
    $hasPdoPgsql = in_array('pgsql', $pdoDrivers, true);

    if (!$hasPdoPgsql) {
        throw new PDOException('could not find driver');
    }

    $dsn = "pgsql:host=$host_postgre;port=$port_postgre;dbname=$dbname_postgre";
    $pdo = new PDO($dsn, $user_postgre, $password_postgre);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // $pdo->exec("SET search_path TO tody");
} catch (PDOException $e) {
    $isDriverError = stripos($e->getMessage(), 'could not find driver') !== false;

    if ($isDriverError) {
        if (!function_exists('pg_connect')) {
            echo "PostgreSQL 연결 실패: PDO_PGSQL 드라이버를 사용할 수 없습니다.";
            exit;
        }

        $connString = sprintf(
            'host=%s port=%s dbname=%s user=%s password=%s',
            $host_postgre,
            $port_postgre,
            $dbname_postgre,
            $user_postgre,
            $password_postgre
        );

        error_clear_last();
        $pgsqlConnection = @pg_connect($connString);

        if (!$pgsqlConnection) {
            $lastError = error_get_last();
            $message = $lastError['message'] ?? 'pg_connect 실패';
            echo "PostgreSQL 연결 실패: {$message}";
            exit;
        }

        $pdo = new PgSqlPdoAdapter($pgsqlConnection);
    } else {
        echo "PostgreSQL 연결 실패: " . $e->getMessage();
        exit;
    }
}

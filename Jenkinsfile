pipeline {
    agent any

    environment {
        // LUÔN LUÔN dùng đường dẫn tuyệt đối cho dbt
        DBT_PROJECT_DIR = "${WORKSPACE}/database/dbt_transform"
        DBT_PROFILES_DIR = "${WORKSPACE}/database/dbt_transform"
        DB_PASSWORD = credentials('db-password-secret-id')
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh '''
                    python3 -m venv venv
                    . venv/bin/activate
                    pip install --upgrade pip
                    pip install dbt-postgres
                '''
            }
        }

        stage('DBT Deps') {
            steps {
                // Đứng ở đâu cũng được, vì mình đã chỉ định PROJECT_DIR tuyệt đối
                sh ". venv/bin/activate && dbt deps --project-dir ${DBT_PROJECT_DIR}"
            }
        }

        stage('DBT Debug') {
            steps {
                sh ". venv/bin/activate && dbt debug --project-dir ${DBT_PROJECT_DIR} --profiles-dir ${DBT_PROFILES_DIR}"
            }
        }

        stage('DBT Run') {
            steps {
                // Sếp dùng build cho nó xịn, vừa run vừa test luôn
                sh ". venv/bin/activate && dbt build --project-dir ${DBT_PROJECT_DIR} --profiles-dir ${DBT_PROFILES_DIR}"
            }
        }
    }

    post {
        always {
            // Sửa lại đường dẫn archive cho đúng tuyệt đối
            archiveArtifacts artifacts: 'database/dbt_transform/logs/*.log', allowEmptyArchive: true
        }
        failure {
            echo "Pipeline 'vấp cỏ' rồi sếp ơi! Check log trong Artifacts nhé."
        }
    }
}
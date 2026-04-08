pipeline {
    agent any 

    environment {
        // Trỏ thẳng DBT_PROFILES_DIR vào thư mục chứa dbt_project.yml và profiles.yml
        DBT_PROJECT_DIR = "database/dbt_transform"
        DB_PASSWORD = credentials('db-password-secret-id')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    python3 -m venv venv
                    . venv/bin/activate
                    pip install --upgrade pip
                    pip install dbt-postgres
                '''
                // Phải vào đúng thư mục mới chạy được dbt deps
                dir("${DBT_PROJECT_DIR}") {
                    sh '../../venv/bin/dbt deps'
                }
            }
        }

        stage('DBT Debug') {
            steps {
                dir("${DBT_PROJECT_DIR}") {
                    // Dùng --profiles-dir . để dbt tìm thấy file profiles.yml trong thư mục này
                    sh '../../venv/bin/dbt debug --profiles-dir .'
                }
            }
        }

        stage('DBT Run') {
            steps {
                dir("${DBT_PROJECT_DIR}") {
                    sh '../../venv/bin/dbt run --profiles-dir .'
                }
            }
        }

        stage('DBT Test (Check NULL)') {
            steps {
                dir("${DBT_PROJECT_DIR}") {
                    sh '../../venv/bin/dbt test --profiles-dir .'
                }
            }
        }
    }

    post {
        always {
            // Sửa lại đường dẫn archive vì dbt sinh log trong thư mục project
            archiveArtifacts artifacts: "${DBT_PROJECT_DIR}/logs/*.log", allowEmptyArchive: true, fingerprint: true
        }
        failure {
            echo "Pipeline thất bại! Hãy kiểm tra log trong ${DBT_PROJECT_DIR}/logs/"
        }
    }
}
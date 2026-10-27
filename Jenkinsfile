// ====================================================================
// Jenkins Declarative Pipeline - Student Attendance Management System
// ====================================================================

pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        ansiColor('xterm')
    }

    environment {
        APP_NAME = 'student-attendance-system'
        DOCKER_IMAGE_BACKEND = "student-attendance-backend:${BUILD_NUMBER}"
        DOCKER_IMAGE_FRONTEND = "student-attendance-frontend:${BUILD_NUMBER}"
        CI = 'true'
    }

    stages {
        stage('1. Source Checkout') {
            steps {
                echo "--> Checking out repository source code..."
                checkout scm
                sh 'git log -1 --pretty=format:"Commit: %h - %s by %an"'
            }
        }

        stage('2. Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        echo "--> Installing Node.js backend dependencies..."
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        echo "--> Installing React frontend dependencies..."
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Test Suite Dependencies') {
                    steps {
                        echo "--> Installing Selenium test runner dependencies..."
                        dir('tests/selenium') {
                            sh 'npm ci || npm install'
                        }
                    }
                }
            }
        }

        stage('3. Automated Quality & Unit Tests') {
            steps {
                echo "--> Running backend test suite and percentage logic validations..."
                dir('backend') {
                    // Fail the pipeline if any automated test assertion fails
                    sh 'npm test'
                }
            }
        }

        stage('4. Frontend Production Build') {
            steps {
                echo "--> Compiling and bundling Vite production static assets..."
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('5. Containerization (Docker Build)') {
            steps {
                echo "--> Building production container images..."
                sh 'docker compose build'
            }
        }

        stage('6. Deployment Smoke Test') {
            steps {
                echo "--> Running containerized health smoke check..."
                sh '''
                    docker compose up -d
                    sleep 10
                    # Probe health check endpoint
                    docker compose exec -T attendance-backend wget --spider http://localhost:5000/api/health || exit 1
                    docker compose down
                '''
            }
        }
    }

    post {
        always {
            echo "--> Cleaning up workspace and temporary build artifacts..."
            cleanWs deleteDirs: true, notFailBuild: true
        }
        success {
            echo "=========================================================="
            echo "  CI/CD PIPELINE SUCCEEDED: Build #${BUILD_NUMBER} passed. "
            echo "=========================================================="
        }
        failure {
            echo "=========================================================="
            echo "  CI/CD PIPELINE FAILED: Required checks did not pass.     "
            echo "=========================================================="
        }
    }
}

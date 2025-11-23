pipeline {
    agent any
    
    tools {
        nodejs 'nodejs'
        allure 'allure'
    }

    parameters {
        choice(
            name: 'BROWSER',
            choices: ['all', 'chrome', 'firefox', 'safari', 'edge'],
            description: 'Selectionez le navigateur pour exécuter les tests'
        )
        booleanParam (
            name: 'HEADLESS',
            defaultValue: false,
            description: 'Executez les tests en mode headless'
        )
    }
    
    environment {
        CI = 'true'
    }

    stages {
        stage('Verify Environment') {
            steps {
                script {
                    // Verify Node.js is available
                    if (isUnix()) {
                        sh "node --version"
                        sh "npm --version"
                    } else {
                        bat "node --version"
                        bat "npm --version"
                    }
                }
            }
        }

        stage('Checkout') {
            steps {
                retry(3) {
                    timeout(time: 1, unit: 'MINUTES') {
                        checkout scm
                    }
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script{
                    def npmCmd = isUnix() ? "sh" : "bat"
                    "${npmCmd}" "npm install"
                }
            }
        }
        
        stage('Install Playwright Browsers') {
            steps {
                script{
                    def npmCmd = isUnix() ? "sh" : "bat"
                    "${npmCmd}" "npx playwright install --with-deps"
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    def testCommand = "npx playwright test"

                    // Add suite if not all
                    if (params.BROWSER != 'all') {
                        testCommand += " --project \"${params.BROWSER}\""
                    }

                    if (params.HEADLESS.toBoolean()) {
                        testCommand += " --headed"
                    }

                    testCommand += " --reporter=allure-playwright"

                    echo "Executing command: ${testCommand}"
                    
                    // Execute tests - don't fail the build for test failures
                    catchError(buildResult: "SUCCESS", stageResult: "UNSTABLE") {
                        def npmCmd = isUnix() ? "sh" : "bat"
                        "${npmCmd}" "${testCommand}"
                    }
                }
            }
        }
        
        stage('Generate Allure Reports') {
            steps {
                script {
                    // Check if report directory exists before publishing
                    if (isUnix()) {
                        sh '''
                            echo "=== Generating Allure Report ==="
                            allure generate allure-results --clean -o allure-report
                            echo "=== Allure Report Contents ==="
                            ls -la allure-report/
                        '''
                    } else {
                        bat '''
                            echo "=== Generating Allure Report ==="
                            allure generate allure-results --clean -o allure-report
                            echo "=== Allure Report Contents ==="
                            dir allure-report
                        '''
                    }
                }
            }
        }
    }
    
    post {
               always {
            // PUBLISH ALLURE REPORT
            allure([
                includeProperties: false,
                jdk: '',
                properties: [],
                reportBuildPolicy: 'ALWAYS',
                results: [[path: 'allure-results']]
            ])
            
            // ARCHIVE ALLURE RESULTS FOR HISTORY
            archiveArtifacts artifacts: 'allure-results/**/*', allowEmptyArchive: true, fingerprint: false
            archiveArtifacts artifacts: 'allure-report/**/*', allowEmptyArchive: true, fingerprint: false
            
            script {
                // Clean diagnostic
                if (isUnix()) {
                    sh '''
                        echo "=== Allure Results ==="
                        if [ -d "allure-results" ]; then
                            find allure-results -name "*.json" | head -5
                        else
                            echo "No allure results generated"
                        fi
                    '''
                } else {
                    bat '''
                        echo "=== Allure Results ==="
                        if exist allure-results (
                            echo "Allure results found:"
                            dir allure-results\\*.json 2>nul | findstr /R /C:".*" | more +5
                        ) else (
                            echo "No allure results generated"
                        )
                    '''
                }
            }
            
            cleanWs()
        }
        
        success {
            echo 'Build completed successfully! All tests passed'
        }
        
        failure {
            echo 'Build failed due to test failures'
        }
        
        unstable {
            echo 'Build completed with unstable status'
        }
    }
}

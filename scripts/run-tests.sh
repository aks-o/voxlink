#!/bin/bash

# VoxLink Test Runner Script
# This script provides an easy way to run different test suites locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if dependencies are installed
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_warning "Dependencies not found. Installing..."
        npm ci
    fi
}

# Function to build packages
build_packages() {
    print_status "Building packages..."
    npm run build
    print_success "Packages built successfully"
}

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    npm run test:unit
    print_success "Unit tests completed"
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    check_docker
    npm run test:integration
    print_success "Integration tests completed"
}

# Function to run E2E tests
run_e2e_tests() {
    print_status "Running E2E tests..."
    check_docker
    npm run test:e2e
    print_success "E2E tests completed"
}

# Function to run contract tests
run_contract_tests() {
    print_status "Running contract tests..."
    check_docker
    npm run test:contract
    print_success "Contract tests completed"
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    print_warning "Performance tests may take several minutes to complete..."
    check_docker
    
    # Start services for performance testing
    print_status "Starting services for performance testing..."
    docker-compose -f docker-compose.test.yml up -d
    sleep 15
    
    # Run performance tests
    npx jest tests/performance --testTimeout=300000 --verbose --runInBand
    
    # Stop services
    docker-compose -f docker-compose.test.yml down
    
    print_success "Performance tests completed"
    
    # Show performance report if available
    if [ -d "tests/coverage/performance-reports" ]; then
        latest_report=$(ls -t tests/coverage/performance-reports/*.html 2>/dev/null | head -n1)
        if [ -n "$latest_report" ]; then
            print_status "Performance report available at: $latest_report"
        fi
    fi
}

# Function to run security tests
run_security_tests() {
    print_status "Running security tests..."
    npx jest tests/security --testTimeout=60000 --verbose
    print_success "Security tests completed"
}

# Function to run all tests
run_all_tests() {
    print_status "Running comprehensive test suite..."
    check_dependencies
    build_packages
    
    run_unit_tests
    run_integration_tests
    run_contract_tests
    run_security_tests
    run_e2e_tests
    run_performance_tests
    
    print_success "All test suites completed successfully!"
}

# Function to run CI tests (excluding performance)
run_ci_tests() {
    print_status "Running CI test suite..."
    check_dependencies
    build_packages
    npm run test:ci
    print_success "CI test suite completed"
}

# Function to show test coverage
show_coverage() {
    print_status "Generating coverage report..."
    
    if [ -d "coverage" ]; then
        # Open coverage report in browser if available
        if command -v open > /dev/null; then
            open coverage/lcov-report/index.html
        elif command -v xdg-open > /dev/null; then
            xdg-open coverage/lcov-report/index.html
        else
            print_status "Coverage report available at: coverage/lcov-report/index.html"
        fi
    else
        print_warning "No coverage report found. Run tests first to generate coverage."
    fi
}

# Function to clean test artifacts
clean_test_artifacts() {
    print_status "Cleaning test artifacts..."
    
    # Remove coverage directories
    rm -rf coverage/
    
    # Remove test containers (if any are running)
    docker ps -a --filter "name=test" --format "table {{.Names}}" | grep -v NAMES | xargs -r docker rm -f
    
    # Remove test volumes
    docker volume ls --filter "name=test" --format "table {{.Names}}" | grep -v NAMES | xargs -r docker volume rm
    
    print_success "Test artifacts cleaned"
}

# Function to setup test environment
setup_test_env() {
    print_status "Setting up test environment..."
    
    # Create .env.test file if it doesn't exist
    if [ ! -f ".env.test" ]; then
        cat > .env.test << EOF
NODE_ENV=test
JWT_SECRET=test-jwt-secret-for-local-development
DATABASE_URL=postgresql://test:test@localhost:5432/voxlink_test
REDIS_URL=redis://localhost:6379
LOG_LEVEL=error
EOF
        print_success "Created .env.test file"
    fi
    
    # Install dependencies
    check_dependencies
    
    # Build packages
    build_packages
    
    print_success "Test environment setup complete"
}

# Function to show help
show_help() {
    echo "VoxLink Test Runner"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  unit         Run unit tests only"
    echo "  integration  Run integration tests only"
    echo "  e2e          Run end-to-end tests only"
    echo "  contract     Run contract tests only"
    echo "  security     Run security tests only"
    echo "  performance  Run performance tests only"
    echo "  all          Run all test suites"
    echo "  ci           Run CI test suite (unit + integration + contract + security)"
    echo "  coverage     Show test coverage report"
    echo "  clean        Clean test artifacts and containers"
    echo "  setup        Setup test environment"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 unit                    # Run only unit tests"
    echo "  $0 all                     # Run all test suites"
    echo "  $0 performance             # Run performance tests"
    echo "  $0 clean && $0 setup       # Clean and setup test environment"
}

# Main script logic
case "${1:-help}" in
    "unit")
        check_dependencies
        run_unit_tests
        ;;
    "integration")
        check_dependencies
        build_packages
        run_integration_tests
        ;;
    "e2e")
        check_dependencies
        build_packages
        run_e2e_tests
        ;;
    "contract")
        check_dependencies
        build_packages
        run_contract_tests
        ;;
    "security")
        check_dependencies
        run_security_tests
        ;;
    "performance")
        check_dependencies
        build_packages
        run_performance_tests
        ;;
    "all")
        run_all_tests
        ;;
    "ci")
        run_ci_tests
        ;;
    "coverage")
        show_coverage
        ;;
    "clean")
        clean_test_artifacts
        ;;
    "setup")
        setup_test_env
        ;;
    "help"|*)
        show_help
        ;;
esac
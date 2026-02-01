# Test Suite Documentation

## Overview

The Dutch Vocabulary Learning App includes a comprehensive test suite validating all core functionality:

- **API Integration Tests**: CRUD operations, error handling, data consistency
- **Component Tests**: UI rendering, user interactions, accessibility
- **Data Validation Tests**: Grammar data, vocabulary structure, progress states

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npm test __tests__/vocabulary.test.ts
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run tests in watch mode
```bash
npm test -- --watch
```

## Test Coverage

### vocabulary.test.ts
- **Database Operations**: Add, read, update, delete operations
- **Grammar Data**: Validation of imported tense data
- **Vocabulary Validation**: Word structure, progress states, CEFR levels
- **Data Persistence**: Cross-request consistency
- **Error Handling**: Invalid IDs, malformed requests

### VocabularyCard.test.tsx
- **Rendering**: Word display, levels, grammar, examples
- **Progress Management**: Button clicks, state highlighting
- **Actions Menu**: Edit/Delete visibility and functionality
- **Expand/Collapse**: Toggle functionality
- **Accessibility**: Proper titles and attributes

### api.integration.test.ts
- **GET Endpoint**: Fetches vocabulary correctly
- **POST Endpoint**: Adds single/multiple words with grammar
- **PUT Endpoint**: Updates words and multiple fields
- **DELETE Endpoint**: Removes words by ID
- **Data Consistency**: Full CRUD cycle validation
- **Error Handling**: Network errors, malformed JSON

## Coverage Goals

- **Branches**: 50%+
- **Functions**: 50%+
- **Lines**: 50%+
- **Statements**: 50%+

## Testing Framework

- **Jest**: Test runner and assertion library
- **@testing-library/react**: Component testing utilities
- **ts-jest**: TypeScript support

## Best Practices

1. **Isolation**: Each test is independent
2. **Clarity**: Test names describe what they validate
3. **Coverage**: Tests cover happy paths and error cases
4. **Speed**: Tests run quickly with minimal I/O
5. **Maintainability**: Tests are easy to understand and update

## CI/CD Integration

Tests are designed to run in:
- Local development environment
- GitHub Actions (CI/CD pipeline)
- Docker containers

## Debugging Tests

### Debug single test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand __tests__/vocabulary.test.ts
```

### Verbose output
```bash
npm test -- --verbose
```

### Show test names without running
```bash
npm test -- --listTests
```

## Future Enhancements

- [ ] E2E tests with Playwright
- [ ] Performance benchmarks
- [ ] Visual regression tests
- [ ] Load testing for large vocabularies
- [ ] Mock service worker for API testing

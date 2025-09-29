# GitHub Actions Storage Dashboard

A comprehensive dashboard to monitor GitHub Actions storage usage across all repositories in your GitHub account, providing detailed insights into storage consumption, billing implications, and optimization opportunities.

## Features

- **Repository Storage Overview**: Display all repositories with their Actions storage usage, artifact counts, and retention policies
- **Detailed Storage Breakdown**: Show artifact details including size, age, workflow source, and retention status
- **Storage Analytics & Trends**: Visual charts showing storage usage over time and billing projections
- **Enterprise Repository Support**: Access repositories from enterprise organizations
- **Auto-Cleanup System**: Automated cleanup of old artifacts based on configurable rules
- **Visitor Tracking**: Built-in visitor counter to track dashboard usage

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A GitHub Personal Access Token with appropriate permissions

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd github-actions-storage-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the displayed local URL (typically `http://localhost:5173`)

### GitHub Token Setup

For the dashboard to access your GitHub repositories, you'll need to create a Personal Access Token:

1. Go to [GitHub Settings > Personal Access Tokens > Fine-grained tokens](https://github.com/settings/personal-access-tokens/new)
2. Create a new token with the following permissions:
   - **Repository permissions**: `Actions (read & write)`, `Metadata (read)`
   - **Account permissions**: Select the repositories you want to monitor
3. Copy the token and paste it into the dashboard when prompted

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

## Technology Stack

- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Phosphor Icons** for iconography
- **Vite** for build tooling
- **GitHub REST API** for data fetching

## Architecture

### Custom Hooks
- `useLocalStorage`: Provides persistent state management using browser localStorage, replacing the original Spark KV store

### API Integration
- `GitHubAPI` class: Handles all interactions with the GitHub REST API
- Type-safe interfaces for all API responses
- Error handling and rate limiting considerations

### Component Structure
- Modular component design with clear separation of concerns
- Reusable UI components from shadcn/ui
- Custom components for GitHub-specific functionality

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Icons from [Phosphor Icons](https://phosphoricons.com/)
- Visitor tracking by [VisitorBadge.io](https://visitorbadge.io/)

[![Visitors](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fgithub-actions-artifacts-cleaner&countColor=%23263759)](https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fgithub-actions-artifacts-cleaner)

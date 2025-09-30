import React from "react";

export function Footer() {
  return (
    <footer className="mt-16 py-8 border-t bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Contact Info */}
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Created by</span>
              <a
                href="https://www.eliostruyf.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Elio Struyf
              </a>
            </div>
            <div className="hidden md:block">•</div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/estruyf"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://twitter.com/eliostruyf"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Twitter
              </a>
              <a
                href="https://www.linkedin.com/in/estruyf"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>

          {/* Visitor Badge */}
          <div className="flex items-center gap-2">
            <img
              src="https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fgithub-actions-artifacts-cleaner&countColor=%23263759"
              alt="Visitor count"
              className="h-5"
            />
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-4 pt-4 border-t border-border/50 text-center text-xs text-muted-foreground">
          <p>
            Built GitHub Spark and GitHub Copilot •{" "}
            <a
              href="https://github.com/estruyf/github-actions-artifacts-cleaner"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              View Source
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
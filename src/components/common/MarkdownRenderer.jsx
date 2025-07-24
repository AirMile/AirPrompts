import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownRenderer = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom styling voor links
          a: ({ node, ...props }) => (
            <a 
              {...props} 
              className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          // Custom styling voor headers
          h1: ({ node, ...props }) => <h1 {...props} className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100" />,
          h2: ({ node, ...props }) => <h2 {...props} className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100" />,
          h3: ({ node, ...props }) => <h3 {...props} className="text-sm font-semibold mb-1 text-gray-900 dark:text-gray-100" />,
          // Lists
          ul: ({ node, ...props }) => <ul {...props} className="list-disc ml-4 mb-2" />,
          ol: ({ node, ...props }) => <ol {...props} className="list-decimal ml-4 mb-2" />,
          li: ({ node, ...props }) => <li {...props} className="mb-1" />,
          // Paragraphs
          p: ({ node, ...props }) => <p {...props} className="mb-2 text-gray-700 dark:text-gray-300" />,
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
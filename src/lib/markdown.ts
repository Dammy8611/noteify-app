export const renderMarkdown = (text: string) => {
    if (!text) return { __html: '' };
    let html = text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    // Heading 2: ## text
    html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
    // Heading 1: # text
    html = html.replace(/^# (.*$)/gim, '<h2>$1</h2>');
    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: _text_
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
     // Monospace: `text`
    html = html.replace(/`(.*?)`/g, '<code class="bg-muted text-muted-foreground rounded-sm px-1.5 py-1 font-mono">$1</code>');
    // Lists: - item
    html = html.replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>');
    html = html.replace(/<\/ul>\n<ul>/g, '');
    // Newlines
    html = html.replace(/\n/g, '<br />');
  
    // Clean up extra <br />s around heading tags
    html = html.replace(/(<\/h2>)<br \/>/g, '$1');
    html = html.replace(/<br \/>(<h2>)/g, '$1');
    html = html.replace(/(<\/h3>)<br \/>/g, '$1');
    html = html.replace(/<br \/>(<h3>)/g, '$1');
  
    return { __html: html };
  };

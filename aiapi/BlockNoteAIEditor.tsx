import React, { useMemo } from 'react';
import {createOpenAI, openai} from '@ai-sdk/openai';
import { BlockNoteEditor, filterSuggestionItems } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import { en } from '@blocknote/core/locales';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import {
  FormattingToolbar,
  FormattingToolbarController,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  getFormattingToolbarItems,
  useCreateBlockNote,
} from '@blocknote/react';
import {
  AIMenuController,
  AIToolbarButton,
  createAIExtension,
  createBlockNoteAIClient,
  getAISlashMenuItems,
} from '@blocknote/xl-ai';
import { en as aiEn } from '@blocknote/xl-ai/locales';
import '@blocknote/xl-ai/style.css';

// Create the proxy client for secure API key handling
const client = createBlockNoteAIClient({
  apiKey: 'dummy-key', // Not used since we're proxying
  baseURL: '/ai/proxy', // Our Go proxy endpoint
});

// Configure OpenAI with our proxy settings
const model = createOpenAI({
  ...client.getProviderSettings('openai'),
  // Override the base URL to point to our proxy
  // baseURL: '/ai/proxy',
})('gpt-4o-2024-08-06');

interface BlockNoteAIEditorProps {
  initialContent?: any[];
  placeholder?: string;
  editable?: boolean;
  className?: string;
  onChange?: (blocks: any[]) => void;
}

export default function BlockNoteAIEditor({
  initialContent,
  placeholder = "Enter some text...",
  editable = true,
  className = "",
  onChange,
}: BlockNoteAIEditorProps) {
  // Creates a new editor instance with AI extension
  const editor = useCreateBlockNote({
    dictionary: {
      ...en,
      ai: aiEn, // Add default translations for the AI extension
    },
    // Register the AI extension
    extensions: [
      createAIExtension({
        model,
      }),
    ],
    initialContent: initialContent || [
      {
        type: 'paragraph',
        content: '',
      },
    ],
  });

  // Handle content changes
  React.useEffect(() => {
    if (onChange) {
      const unsubscribe = editor.onChange(() => {
        onChange(editor.document);
      });
      return unsubscribe;
    }
  }, [editor, onChange]);

  return (
    <div className={`blocknote-ai-editor ${className}`}>
      <BlockNoteView
        editor={editor}
        // We're disabling some default UI elements to replace them with AI-enabled versions
        formattingToolbar={false}
        slashMenu={false}
        placeholder={placeholder}
      >
        {/* Add the AI Command menu to the editor */}
        <AIMenuController />

        {/* Custom formatting toolbar with AI button */}
        <FormattingToolbarWithAI />

        {/* Custom slash menu with AI options */}
        <SuggestionMenuWithAI editor={editor} />
      </BlockNoteView>
    </div>
  );
}

// Formatting toolbar with the AI button added
function FormattingToolbarWithAI() {
  return (
    <FormattingToolbarController
      formattingToolbar={() => (
        <FormattingToolbar>
          {...getFormattingToolbarItems()}
          {/* Add the AI button */}
          <AIToolbarButton />
        </FormattingToolbar>
      )}
    />
  );
}

// Slash menu with AI options added
function SuggestionMenuWithAI(props: {
  editor: BlockNoteEditor<any, any, any>;
}) {
  return (
    <SuggestionMenuController
      triggerCharacter="/"
      getItems={async (query) =>
        filterSuggestionItems(
          [
            ...getDefaultReactSlashMenuItems(props.editor),
            // Add the default AI slash menu items
            ...getAISlashMenuItems(props.editor),
          ],
          query,
        )
      }
    />
  );
}

// Export components for use in other parts of the application
export { FormattingToolbarWithAI, SuggestionMenuWithAI };
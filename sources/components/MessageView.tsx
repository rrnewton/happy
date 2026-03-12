import * as React from "react";
import { View, Text, Pressable } from "react-native";
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Octicons } from '@expo/vector-icons';
import { MarkdownView } from "./markdown/MarkdownView";
import { t } from '@/text';
import { Message, UserTextMessage, AgentTextMessage, ToolCallMessage, ThinkingMessage, SubAgentInvocation } from "@/sync/typesMessage";
import { Metadata } from "@/sync/storageTypes";
import { useResponsiveMaxWidth } from "./layout";
import { ToolView } from "./tools/ToolView";
import { AgentEvent } from "@/sync/typesRaw";
import { sync } from '@/sync/sync';
import { Option } from './markdown/MarkdownView';
import { MessageImage } from './MessageImage';
import { useSetting } from '@/sync/storage';

export const MessageView = React.memo((props: {
  message: Message;
  metadata: Metadata | null;
  sessionId: string;
  getMessageById?: (id: string) => Message | null;
  onMessageSelect?: (messageId: string) => void;
  isSelected?: boolean;
  onOptionEdit?: (text: string) => void;
}) => {
  const responsiveMaxWidth = useResponsiveMaxWidth();

  const messageContentStyle = React.useMemo(() => ({
    flexDirection: 'column' as const,
    flexGrow: 1,
    flexBasis: 0,
    maxWidth: responsiveMaxWidth as any,
  }), [responsiveMaxWidth]);

  return (
    <View style={styles.messageContainer} renderToHardwareTextureAndroid={true}>
      <View style={messageContentStyle}>
        <RenderBlock
          message={props.message}
          metadata={props.metadata}
          sessionId={props.sessionId}
          getMessageById={props.getMessageById}
          onMessageSelect={props.onMessageSelect}
          isSelected={props.isSelected}
          onOptionEdit={props.onOptionEdit}
        />
      </View>
    </View>
  );
});

// RenderBlock function that dispatches to the correct component based on message kind
function RenderBlock(props: {
  message: Message;
  metadata: Metadata | null;
  sessionId: string;
  getMessageById?: (id: string) => Message | null;
  onMessageSelect?: (messageId: string) => void;
  isSelected?: boolean;
  onOptionEdit?: (text: string) => void;
}): React.ReactElement {
  switch (props.message.kind) {
    case 'user-text':
      return <UserTextBlock message={props.message} sessionId={props.sessionId} onOptionEdit={props.onOptionEdit} />;

    case 'agent-text':
      return <AgentTextBlock message={props.message} sessionId={props.sessionId} onOptionEdit={props.onOptionEdit} />;

    case 'tool-call':
      return <ToolCallBlock
        message={props.message}
        metadata={props.metadata}
        sessionId={props.sessionId}
        getMessageById={props.getMessageById}
        onMessageSelect={props.onMessageSelect}
        isSelected={props.isSelected}
      />;

    case 'agent-event':
      return <AgentEventBlock event={props.message.event} metadata={props.metadata} />;

    case 'thinking':
      return <ThinkingBlock message={props.message} />;

    case 'sub-agent-invocation':
      return <SubAgentInvocationBlock message={props.message} />;

    default:
      // Exhaustive check - TypeScript will error if we miss a case
      const _exhaustive: never = props.message;
      throw new Error(`Unknown message kind: ${_exhaustive}`);
  }
}

function UserTextBlock(props: {
  message: UserTextMessage;
  sessionId: string;
  onOptionEdit?: (text: string) => void;
}) {
  const { theme } = useUnistyles();
  const highContrastMessages = useSetting('highContrastMessages');

  const handleOptionPress = React.useCallback((option: Option) => {
    sync.sendMessage(props.sessionId, option.title);
  }, [props.sessionId]);

  const handleOptionEdit = React.useCallback((option: Option) => {
    props.onOptionEdit?.(option.title);
  }, [props.onOptionEdit]);

  const hasImages = props.message.images && props.message.images.length > 0;
  const hasText = props.message.text.length > 0;

  const bubbleStyle = React.useMemo(() => [
    styles.userMessageBubble,
    highContrastMessages && {
      backgroundColor: theme.colors.userMessageBackgroundHighContrast,
    }
  ], [highContrastMessages, theme.colors.userMessageBackgroundHighContrast]);

  const textColor = highContrastMessages ? theme.colors.userMessageTextHighContrast : undefined;
  const linkColor = highContrastMessages ? theme.colors.userMessageLinkHighContrast : undefined;
  const codeBackground = highContrastMessages ? theme.colors.userMessageCodeBackgroundHighContrast : undefined;

  return (
    <View style={styles.userMessageContainer}>
      <View style={bubbleStyle}>
        {hasText && (
          <MarkdownView markdown={props.message.displayText || props.message.text} onOptionPress={handleOptionPress} onOptionEdit={handleOptionEdit} textColor={textColor} linkColor={linkColor} codeBackground={codeBackground} />
        )}
        {hasImages && (
          <View style={styles.imagesContainer}>
            {props.message.images!.map((image) => (
              <MessageImage
                key={image.blobId}
                image={image}
                sessionId={props.sessionId}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function AgentTextBlock(props: {
  message: AgentTextMessage;
  sessionId: string;
  onOptionEdit?: (text: string) => void;
}) {
  const handleOptionPress = React.useCallback((option: Option) => {
    sync.sendMessage(props.sessionId, option.title);
  }, [props.sessionId]);

  const handleOptionEdit = React.useCallback((option: Option) => {
    props.onOptionEdit?.(option.title);
  }, [props.onOptionEdit]);

  return (
    <View style={styles.agentMessageContainer}>
      <MarkdownView markdown={props.message.text} onOptionPress={handleOptionPress} onOptionEdit={handleOptionEdit} />
    </View>
  );
}

function AgentEventBlock(props: {
  event: AgentEvent;
  metadata: Metadata | null;
}) {
  if (props.event.type === 'switch') {
    return (
      <View style={styles.agentEventContainer}>
        <Text style={styles.agentEventText}>{t('message.switchedToMode', { mode: props.event.mode })}</Text>
      </View>
    );
  }
  if (props.event.type === 'message') {
    return (
      <View style={styles.agentEventContainer}>
        <Text style={styles.agentEventText}>{props.event.message}</Text>
      </View>
    );
  }
  if (props.event.type === 'limit-reached') {
    const formatTime = (timestamp: number): string => {
      try {
        const date = new Date(timestamp * 1000); // Convert from Unix timestamp
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        return t('message.unknownTime');
      }
    };

    return (
      <View style={styles.agentEventContainer}>
        <Text style={styles.agentEventText}>
          {t('message.usageLimitUntil', { time: formatTime(props.event.endsAt) })}
        </Text>
      </View>
    );
  }
  if (props.event.type === 'bash-result') {
    return <BashResultBlock event={props.event} />;
  }
  return (
    <View style={styles.agentEventContainer}>
      <Text style={styles.agentEventText}>{t('message.unknownEvent')}</Text>
    </View>
  );
}

function ToolCallBlock(props: {
  message: ToolCallMessage;
  metadata: Metadata | null;
  sessionId: string;
  getMessageById?: (id: string) => Message | null;
  onMessageSelect?: (messageId: string) => void;
  isSelected?: boolean;
}) {
  if (!props.message.tool) {
    return null;
  }

  // Create press handler if we have onMessageSelect
  const handlePress = props.onMessageSelect
    ? () => props.onMessageSelect!(props.message.id)
    : undefined;

  return (
    <View style={styles.toolContainer}>
      <ToolView
        tool={props.message.tool}
        metadata={props.metadata}
        messages={props.message.children}
        sessionId={props.sessionId}
        messageId={props.message.id}
        onPress={handlePress}
        isSelected={props.isSelected}
      />
    </View>
  );
}

function ThinkingBlock(props: {
  message: ThinkingMessage;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <View style={styles.thinkingContainer}>
      <Pressable style={styles.thinkingHeader} onPress={() => setExpanded(!expanded)}>
        <View style={styles.thinkingIconContainer}>
          <Octicons name="light-bulb" size={16} color={styles.thinkingLabel.color} />
        </View>
        <Text style={styles.thinkingLabel} numberOfLines={1}>
          {t('message.thinking')}{'  '}
          {!expanded && <Text style={styles.thinkingPreview}>{props.message.thinking}</Text>}
        </Text>
      </Pressable>
      {expanded && (
        <Text style={styles.thinkingText}>{props.message.thinking}</Text>
      )}
    </View>
  );
}

function SubAgentInvocationBlock(props: {
  message: SubAgentInvocation;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <View style={styles.subAgentContainer}>
      <View style={styles.subAgentHeader}>
        <Text style={styles.subAgentHeaderText}>
          🤖 {t('message.subAgentInvocation')}: {props.message.subagentType}
        </Text>
        <Text style={styles.subAgentDescription}>{props.message.description}</Text>
      </View>

      {expanded && (
        <View style={styles.subAgentDetails}>
          <Text style={styles.subAgentLabel}>{t('message.prompt')}:</Text>
          <Text style={styles.subAgentText}>{props.message.prompt}</Text>

          <Text style={styles.subAgentLabel}>{t('message.result')}:</Text>
          <Text style={styles.subAgentText}>{props.message.result || t('message.pending')}</Text>

          {__DEV__ && props.message.apiMessage && (
            <>
              <Text style={styles.subAgentLabel}>Debug - API Message:</Text>
              <Text style={styles.subAgentDebugText}>
                {JSON.stringify(props.message.apiMessage, null, 2)}
              </Text>
            </>
          )}
        </View>
      )}

      <Text
        style={styles.subAgentToggle}
        onPress={() => setExpanded(!expanded)}
      >
        {expanded ? t('common.showLess') : t('common.showMore')}
      </Text>
    </View>
  );
}

type BashResultEvent = Extract<AgentEvent, { type: 'bash-result' }>;

function BashResultBlock(props: { event: BashResultEvent }) {
  const { theme } = useUnistyles();
  const { event } = props;
  const hasOutput = event.stdout.length > 0 || event.stderr.length > 0;

  return (
    <View style={styles.bashResultContainer}>
      <View style={styles.bashResultHeader}>
        <Text style={styles.bashResultCommand} numberOfLines={1}>
          $ {event.command}
        </Text>
        <Text style={[
          styles.bashResultExitCode,
          { color: event.success ? theme.colors.success : theme.colors.textDestructive }
        ]}>
          {event.exitCode === 0 ? '✓' : `exit ${event.exitCode}`}
        </Text>
      </View>
      {hasOutput && (
        <View style={styles.bashResultOutput}>
          {event.stdout.length > 0 && (
            <Text style={styles.bashResultStdout} selectable>
              {event.stdout}
            </Text>
          )}
          {event.stderr.length > 0 && (
            <Text style={styles.bashResultStderr} selectable>
              {event.stderr}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  userMessageContainer: {
    maxWidth: '100%',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  userMessageBubble: {
    backgroundColor: theme.colors.userMessageBackground,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: '100%',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  agentMessageContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  agentEventContainer: {
    marginHorizontal: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  agentEventText: {
    color: theme.colors.agentEventText,
    fontSize: 14,
  },
  toolContainer: {
    marginHorizontal: 8,
  },
  debugText: {
    color: theme.colors.agentEventText,
    fontSize: 12,
  },
  thinkingContainer: {
    marginHorizontal: 16,
    marginBottom: 2,
    paddingVertical: 2,
  },
  thinkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  thinkingIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thinkingLabel: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  thinkingPreview: {
    fontWeight: '400',
    opacity: 0.5,
  },
  thinkingText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
    marginLeft: 28,
  },
  subAgentContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceHigh,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.textLink,
  },
  subAgentHeader: {
    marginBottom: 8,
  },
  subAgentHeaderText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  subAgentDescription: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  subAgentDetails: {
    marginTop: 8,
    marginBottom: 8,
  },
  subAgentLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  subAgentText: {
    color: theme.colors.text,
    fontSize: 13,
    opacity: 0.9,
  },
  subAgentDebugText: {
    color: theme.colors.agentEventText,
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: theme.colors.surface,
    padding: 8,
    borderRadius: 4,
  },
  subAgentToggle: {
    color: theme.colors.textLink,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  bashResultContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceHigh,
    overflow: 'hidden',
  },
  bashResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  bashResultCommand: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  bashResultExitCode: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  bashResultOutput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bashResultStdout: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  bashResultStderr: {
    color: theme.colors.textDestructive,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 4,
  },
}));

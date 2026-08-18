import { type ReactNode, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextInputProps,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';

import { useColors } from '../theme/use-theme';
import { type Palette, TAP_SIZE, fontSize, radius, spacing } from '../theme/tokens';

/**
 * RN primitive — web-এর `shared/ui`-এর সমকক্ষ, কিন্তু component ভাগ করা
 * হয়নি (docs/05 §16: "Component — web = Tailwind/Radix, mobile = RN primitive")।
 *
 * ভাগ করা হয়েছে কেবল **নাম আর আচরণ**: `Button`-এর `variant`, `Badge`-এর
 * `tone`, `EmptyState`-এর গঠন — সব এক। তাতে দুই app-এ কাজ করা মানুষটির
 * নতুন শব্দভাণ্ডার শিখতে হয় না।
 */

/* ── Typography ──────────────────────────────────────────────────────── */

type TextTone = 'default' | 'muted' | 'subtle' | 'primary' | 'danger' | 'success' | 'warning';

export function AppText({
  children,
  size = 'md',
  weight = 'regular',
  tone = 'default',
  style,
  numberOfLines,
  accessibilityRole,
}: {
  children: ReactNode;
  size?: keyof typeof fontSize;
  weight?: 'regular' | 'medium' | 'bold';
  tone?: TextTone;
  style?: ViewStyle | ViewStyle[] | object;
  numberOfLines?: number;
  /** ভুল বার্তার জন্য `alert` — screen reader সঙ্গে সঙ্গে পড়ে শোনায় */
  accessibilityRole?: 'alert' | 'header' | 'text';
}) {
  const colors = useColors();
  const toneColor: Record<TextTone, string> = {
    default: colors.fg,
    muted: colors.fgMuted,
    subtle: colors.fgSubtle,
    primary: colors.primary,
    danger: colors.danger,
    success: colors.success,
    warning: colors.warning,
  };

  return (
    <Text
      accessibilityRole={accessibilityRole}
      numberOfLines={numberOfLines}
      style={[
        {
          color: toneColor[tone],
          fontSize: fontSize[size],
          fontWeight: weight === 'bold' ? '700' : weight === 'medium' ? '600' : '400',
          // বাংলা যুক্তাক্ষরের জন্য বাড়তি line-height — নাহলে মাত্রা কেটে যায়
          lineHeight: fontSize[size] * 1.5,
        },
        style as object,
      ]}
    >
      {children}
    </Text>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return (
    <AppText size="xl" weight="bold">
      {children}
    </AppText>
  );
}

/* ── Button ──────────────────────────────────────────────────────────── */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  children,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessibilityLabel,
  fullWidth = false,
}: {
  children: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  fullWidth?: boolean;
}) {
  const colors = useColors();
  const inactive = disabled || loading;

  const background: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.surfaceMuted,
    ghost: 'transparent',
    danger: colors.danger,
  };
  const foreground: Record<ButtonVariant, string> = {
    primary: colors.primaryFg,
    secondary: colors.fg,
    ghost: colors.primary,
    danger: colors.primaryFg,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: TAP_SIZE,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.md,
          backgroundColor: background[variant],
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.sm,
          opacity: inactive ? 0.6 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={foreground[variant]} /> : null}
      <Text style={{ color: foreground[variant], fontSize: fontSize.md, fontWeight: '600' }}>
        {children}
      </Text>
    </Pressable>
  );
}

/* ── Card ────────────────────────────────────────────────────────────── */

export function Card({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  const colors = useColors();
  const style: ViewStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  };

  if (!onPress) return <View style={style}>{children}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [style, { opacity: pressed ? 0.9 : 1 }]}
    >
      {children}
    </Pressable>
  );
}

/* ── Badge ───────────────────────────────────────────────────────────── */

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  const colors = useColors();
  const fg: Record<Tone, string> = {
    neutral: colors.neutral,
    info: colors.info,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  };
  const bg: Record<Tone, string> = {
    neutral: colors.neutralBg,
    info: colors.infoBg,
    success: colors.successBg,
    warning: colors.warningBg,
    danger: colors.dangerBg,
  };

  return (
    <View
      style={{
        backgroundColor: bg[tone],
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: fg[tone], fontSize: fontSize.xs, fontWeight: '600' }}>{children}</Text>
    </View>
  );
}

/* ── Field ───────────────────────────────────────────────────────────── */

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string | undefined;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText size="sm" weight="medium">
        {label}
      </AppText>
      {children}
      {hint && !error ? (
        <AppText size="xs" tone="muted">
          {hint}
        </AppText>
      ) : null}
      {error ? (
        <AppText size="xs" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function Input({
  label,
  error,
  hint,
  ...props
}: TextInputProps & { label: string; error?: string | undefined; hint?: string }) {
  const colors = useColors();

  return (
    <Field label={label} error={error} hint={hint}>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.fgSubtle}
        style={{
          minHeight: TAP_SIZE,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          color: colors.fg,
          fontSize: fontSize.md,
        }}
        {...props}
      />
    </Field>
  );
}

/**
 * বাছাই — native picker নয়, চিপের সারি।
 *
 * `@react-native-picker/picker` একটি native module, অর্থাৎ Expo Go-তে
 * চলে না এবং প্রতিটি বিকল্প দেখতে একটি অতিরিক্ত tap লাগে। মক্কেলের
 * বাছাইগুলো ছোট (২–৫টি আইনজীবী, ৩টি মাধ্যম), তাই সব বিকল্প একসাথে
 * দেখানোই দ্রুত — আর কী কী আছে তা লুকানো থাকে না।
 */
export function ChipSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
  hint,
}: {
  label: string;
  value: T | '';
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  error?: string | undefined;
  hint?: string;
}) {
  const colors = useColors();

  return (
    <Field label={label} error={error} hint={hint}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => onChange(option.value)}
              style={{
                minHeight: TAP_SIZE,
                justifyContent: 'center',
                paddingHorizontal: spacing.lg,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primaryMuted : colors.surface,
              }}
            >
              <Text
                style={{
                  color: selected ? colors.primary : colors.fg,
                  fontSize: fontSize.sm,
                  fontWeight: selected ? '600' : '400',
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Field>
  );
}

/* ── States ──────────────────────────────────────────────────────────── */

export function Skeleton({ rows = 3 }: { rows?: number }) {
  const colors = useColors();
  const items = useMemo(() => Array.from({ length: rows }, (_, index) => index), [rows]);

  return (
    <View accessibilityRole="progressbar" style={{ gap: spacing.md }}>
      {items.map((index) => (
        <View
          key={index}
          style={{
            height: 84,
            borderRadius: radius.lg,
            backgroundColor: colors.surfaceMuted,
          }}
        />
      ))}
    </View>
  );
}

export function EmptyState({ title, body }: { title?: string; body: string }) {
  return (
    <View style={{ paddingVertical: spacing.xxl, gap: spacing.sm, alignItems: 'center' }}>
      {title ? (
        <AppText size="lg" weight="medium">
          {title}
        </AppText>
      ) : null}
      <AppText tone="muted" style={{ textAlign: 'center' }}>
        {body}
      </AppText>
    </View>
  );
}

export function ErrorState({ message, onRetry, retryLabel }: { message: string; onRetry?: () => void; retryLabel: string }) {
  return (
    <View style={{ paddingVertical: spacing.xxl, gap: spacing.md, alignItems: 'center' }}>
      <AppText tone="danger" style={{ textAlign: 'center' }}>
        {message}
      </AppText>
      {onRetry ? (
        <Button variant="secondary" onPress={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </View>
  );
}

/* ── Screen shell ────────────────────────────────────────────────────── */

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const colors = useColors();
  const content: ViewStyle = { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl };

  if (!scroll) {
    return <View style={[styles.flex, { backgroundColor: colors.bg }, content]}>{children}</View>;
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.bg }]}
      contentContainerStyle={content}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

/** সারি — label বাঁয়ে, মান ডানে। মামলার বিবরণে সবচেয়ে বেশি ব্যবহৃত। */
export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
      <AppText size="sm" tone="muted">
        {label}
      </AppText>
      <View style={{ flexShrink: 1, alignItems: 'flex-end' }}>
        {typeof value === 'string' ? (
          <AppText size="sm" weight="medium">
            {value}
          </AppText>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

export function Divider() {
  const colors = useColors();
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export type { Palette };

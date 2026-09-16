import { style } from '@vanilla-extract/css';
import { color, DefaultReset, config } from 'folds';

export const TranslationBox = style([
  DefaultReset,
  {
    backgroundColor: color.SurfaceVariant.Container,
    border: `${config.borderWidth.B300} solid ${color.SurfaceVariant.ContainerLine}`,
  },
]);

export const TranslationText = style({
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});

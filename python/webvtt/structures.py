import re
import typing
from datetime import datetime, time

from .errors import MalformedCaptionError


class WebVTTCueBlock:
    CUE_TIMINGS_PATTERN = re.compile(
        r'\s*((?:\d+:)?\d{2}:\d{2}.\d{3})\s*-->\s*((?:\d+:)?\d{2}:\d{2}.\d{3})'
        )

    def __init__(self, identifier, start, end, payload):
        self.identifier = identifier
        self.start = start
        self.end = end
        self.payload = payload

    @classmethod
    def is_valid(cls, lines: typing.Sequence[str]) -> bool:
        return bool(
            (
              len(lines) >= 2 and
              re.match(cls.CUE_TIMINGS_PATTERN, lines[0]) and
              "-->" not in lines[1]
              ) or
            (
              len(lines) >= 3 and
              "-->" not in lines[0] and
              re.match(cls.CUE_TIMINGS_PATTERN, lines[1]) and
              "-->" not in lines[2]
              )
        )

    @classmethod
    def from_lines(cls, lines: typing.Iterable[str]) -> 'WebVTTCueBlock':

        identifier = None
        start = None
        end = None
        payload = []

        for line in lines:
            timing_match = re.match(cls.CUE_TIMINGS_PATTERN, line)
            if timing_match:
                start = timing_match.group(1)
                end = timing_match.group(2)
            elif not start:
                identifier = line
            else:
                payload.append(line)

        return cls(identifier, start, end, payload)


class WebVTTCommentBlock:
    COMMENT_PATTERN = re.compile(r'NOTE\s(.*?)\Z', re.DOTALL)

    def __init__(self, text: str):
        self.text = text

    @classmethod
    def is_valid(cls, lines: typing.Sequence[str]) -> bool:
        return lines[0].startswith('NOTE')

    @classmethod
    def from_lines(cls, lines: typing.Iterable[str]) -> 'WebVTTCommentBlock':
        match = cls.COMMENT_PATTERN.match('\n'.join(lines))
        return cls(text=match.group(1).strip() if match else '')


class WebVTTStyleBlock:
    STYLE_PATTERN = re.compile(r'STYLE\s(.*?)\Z', re.DOTALL)

    def __init__(self, text):
        self.text = text

    @classmethod
    def is_valid(cls, lines: typing.Sequence[str]) -> bool:
        return lines[0].startswith('STYLE')

    @classmethod
    def from_lines(cls, lines: typing.Iterable[str]) -> 'WebVTTStyleBlock':
        match = cls.STYLE_PATTERN.match('\n'.join(lines))
        return cls(text=match.group(1).strip() if match else '')


class SRTCueBlock:
    CUE_TIMINGS_PATTERN = re.compile(
        r'\s*(\d+:\d{2}:\d{2},\d{3})\s*-->\s*(\d+:\d{2}:\d{2},\d{3})'
        )

    def __init__(
            self,
            index: str,
            start: time,
            end: time,
            payload: typing.Sequence[str]
    ):
        self.index = index
        self.start = start
        self.end = end
        self.payload = payload

    @classmethod
    def is_valid(cls, lines: typing.Sequence[str]) -> bool:
        return bool(
          len(lines) >= 3 and
          lines[0].isdigit() and
          re.match(cls.CUE_TIMINGS_PATTERN, lines[1])
          )

    @classmethod
    def from_lines(cls, lines: typing.Sequence[str]) -> 'SRTCueBlock':

        index = lines[0]

        match = re.match(cls.CUE_TIMINGS_PATTERN, lines[1])
        assert match is not None
        start, end = map(lambda x: datetime.strptime(x, '%H:%M:%S,%f').time(),
                         (match.group(1), match.group(2))
                         )

        payload = lines[2:]

        return cls(index, start, end, payload)


class SBVCueBlock:
    CUE_TIMINGS_PATTERN = re.compile(
        r'\s*(\d+:\d{2}:\d{2}.\d{3}),(\d+:\d{2}:\d{2}.\d{3})'
        )

    def __init__(
            self,
            start: time,
            end: time,
            payload: typing.Sequence[str]
            ):
        self.start = start
        self.end = end
        self.payload = payload

    @classmethod
    def is_valid(cls, lines: typing.Sequence[str]) -> bool:
        return bool(
          len(lines) >= 2 and
          re.match(cls.CUE_TIMINGS_PATTERN, lines[0]) and
          lines[1].strip()
          )

    @classmethod
    def from_lines(cls, lines: typing.Sequence[str]) -> 'SBVCueBlock':
        match = re.match(cls.CUE_TIMINGS_PATTERN, lines[0])
        assert match is not None
        start, end = map(lambda x: datetime.strptime(x, '%H:%M:%S.%f').time(),
                         (match.group(1), match.group(2))
                         )

        payload = lines[1:]

        return cls(start, end, payload)


class Caption:
    CUE_TEXT_TAGS = re.compile('<.*?>')

    def __init__(self,
                 start: typing.Optional[typing.Union[str, time]] = None,
                 end: typing.Optional[typing.Union[str, time]] = None,
                 text: typing.Optional[typing.Union[str,
                                                    typing.Sequence[str]
                                                    ]] = None,
                 identifier: typing.Optional[str] = None
                 ):
        text = text or []
        self.start = start or time()
        self.end = end or time()
        self.identifier = identifier
        self.lines = (text.splitlines()
                      if isinstance(text, str)
                      else
                      list(text)
                      )
        self.comments: typing.List[str] = []

    def __repr__(self):
        cleaned_text = self.text.replace('\n', '\\n')
        return (f'<{self.__class__.__name__} '
                f'start={self.start!r} '
                f'end={self.end!r} '
                f'text={cleaned_text!r} '
                f'identifier={self.identifier!r}>'
                )

    def __str__(self):
        cleaned_text = self.text.replace('\n', '\\n')
        return f'{self.start} {self.end} {cleaned_text}'

    def __eq__(self, other):
        return (self.start == other.start and
                self.end == other.end and
                self.raw_text == other.raw_text
                )

    def add_line(self, line: str):
        self.lines.append(line)

    @property
    def start(self):
        return self.format_timestamp(self._start)

    @start.setter
    def start(self, value):
        self._start = self.parse_timestamp(value)

    @property
    def end(self):
        return self.format_timestamp(self._end)

    @end.setter
    def end(self, value):
        self._end = self.parse_timestamp(value)

    @property
    def start_in_seconds(self):
        return self.time_in_seconds(self._start)

    @property
    def end_in_seconds(self):
        return self.time_in_seconds(self._end)

    @property
    def raw_text(self) -> str:
        """Return the caption's lines as text (including cue tags)"""
        return '\n'.join(self.lines)

    @property
    def text(self) -> str:
        """Return the caption's lines as text (without cue tags)"""
        return re.sub(self.CUE_TEXT_TAGS, '', self.raw_text)

    @text.setter
    def text(self, value: str):
        if not isinstance(value, str):
            raise AttributeError(
                f'String value expected but received {value}.'
                )

        self.lines = value.splitlines()

    @staticmethod
    def parse_timestamp(value: typing.Union[str, time]):
        if isinstance(value, str):
            time_format = '%H:%M:%S.%f' if len(value) >= 11 else '%M:%S.%f'
            try:
                return datetime.strptime(value, time_format).time()
            except ValueError:
                raise MalformedCaptionError(f'Invalid timestamp: {value}')
        elif isinstance(value, time):
            return value

        raise AttributeError(f'The type {type(value)} is not supported')

    @staticmethod
    def format_timestamp(time_obj: time) -> str:
        microseconds = int(time_obj.microsecond / 1000)
        return f'{time_obj.strftime("%H:%M:%S")}.{microseconds:03d}'

    @staticmethod
    def time_in_seconds(time_obj: time) -> int:
        return (time_obj.hour * 3600 +
                time_obj.minute * 60 +
                time_obj.second +
                time_obj.microsecond // 1_000_000
                )


class Style:
    def __init__(self, text: typing.Union[str, typing.List[str]]):
        self.lines = text.splitlines() if isinstance(text, str) else text
        self.comments: typing.List[str] = []

    @property
    def text(self):
        return '\n'.join(self.lines)

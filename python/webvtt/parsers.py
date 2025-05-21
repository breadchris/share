import typing
from abc import ABC, abstractmethod

from .errors import MalformedFileError
from .structures import (Style,
                         Caption,
                         WebVTTCueBlock,
                         WebVTTCommentBlock,
                         WebVTTStyleBlock,
                         SRTCueBlock,
                         SBVCueBlock,
                         )


class Parser(ABC):

    @classmethod
    def parse(cls, lines: typing.Sequence[str]):
        if not cls.validate(lines):
            raise MalformedFileError('Invalid format')
        return cls.parse_content(lines)

    @staticmethod
    def iter_blocks_of_lines(
            lines: typing.Iterable[str]
            ) -> typing.Generator[typing.List[str], None, None]:
        current_text_block = []

        for line in lines:
            if line.strip():
                current_text_block.append(line)
            elif current_text_block:
                yield current_text_block
                current_text_block = []

        if current_text_block:
            yield current_text_block

    @classmethod
    @abstractmethod
    def validate(cls, lines: typing.Sequence[str]) -> bool:
        raise NotImplementedError

    @classmethod
    @abstractmethod
    def parse_content(cls, lines: typing.Sequence[str]):
        raise NotImplementedError


class WebVTTParser(Parser):
    """
    Web Video Text Track parser.
    """

    @classmethod
    def validate(cls, lines: typing.Sequence[str]) -> bool:
        return bool(lines and lines[0].startswith('WEBVTT'))

    @classmethod
    def parse_content(cls,
                      lines: typing.Sequence[str]
                      ) -> typing.List[typing.Union[Style, Caption]]:
        items: typing.List[typing.Union[Caption, Style]] = []
        comments: typing.List[WebVTTCommentBlock] = []

        for block_lines in cls.iter_blocks_of_lines(lines):
            if WebVTTCueBlock.is_valid(block_lines):
                cue_block = WebVTTCueBlock.from_lines(block_lines)
                caption = Caption(cue_block.start,
                                  cue_block.end,
                                  cue_block.payload,
                                  cue_block.identifier
                                  )

                if comments:
                    caption.comments = [comment.text for comment in comments]
                    comments = []
                items.append(caption)

            elif WebVTTCommentBlock.is_valid(block_lines):
                comments.append(WebVTTCommentBlock.from_lines(block_lines))

            elif WebVTTStyleBlock.is_valid(block_lines):
                style = Style(WebVTTStyleBlock.from_lines(block_lines).text)
                if comments:
                    style.comments = [comment.text for comment in comments]
                    comments = []
                items.append(style)

        if comments and items:
            items[-1].comments = [comment.text for comment in comments]

        return items


class SRTParser(Parser):
    """
    SubRip SRT parser.
    """

    @classmethod
    def validate(cls, lines: typing.Sequence[str]) -> bool:
        return bool(
            len(lines) >= 3 and
            lines[0].isdigit() and
            '-->' in lines[1] and
            lines[2].strip()
            )

    @classmethod
    def parse_content(
            cls,
            lines: typing.Sequence[str]
            ) -> typing.List[Caption]:
        captions: typing.List[Caption] = []

        for block_lines in cls.iter_blocks_of_lines(lines):
            if not SRTCueBlock.is_valid(block_lines):
                continue

            cue_block = SRTCueBlock.from_lines(block_lines)
            captions.append(Caption(cue_block.start,
                                    cue_block.end,
                                    cue_block.payload
                                    ))

        return captions


class SBVParser(Parser):
    """
    YouTube SBV parser.
    """

    @classmethod
    def validate(cls, lines: typing.Sequence[str]) -> bool:
        if len(lines) < 2:
            return False

        first_block = next(cls.iter_blocks_of_lines(lines))
        return bool(first_block and SBVCueBlock.is_valid(first_block))

    @classmethod
    def parse_content(
            cls,
            lines: typing.Sequence[str]
            ) -> typing.List[Caption]:
        captions = []

        for block_lines in cls.iter_blocks_of_lines(lines):
            if not SBVCueBlock.is_valid(block_lines):
                continue

            cue_block = SBVCueBlock.from_lines(block_lines)
            captions.append(Caption(cue_block.start,
                                    cue_block.end,
                                    cue_block.payload
                                    ))

        return captions

import typing

from .structures import Caption


def write_vtt(f: typing.IO[str], captions: typing.Iterable[Caption]):
    f.write(webvtt_content(captions))


def webvtt_content(captions: typing.Iterable[Caption]) -> str:
    """Return captions content with webvtt formatting."""
    output = ['WEBVTT']
    for caption in captions:
        output.extend([
            '',
            *(identifier for identifier in {caption.identifier} if identifier),
            f'{caption.start} --> {caption.end}',
            *caption.lines
        ])
    return '\n'.join(output)


def write_srt(f: typing.IO[str], captions: typing.Iterable[Caption]):
    output = []
    for index, caption in enumerate(captions, start=1):
        output.extend([
            f'{index}',
            '{} --> {}'.format(*map(lambda x: x.replace('.', ','),
                                    (caption.start, caption.end))
                               ),
            *caption.lines,
            ''
            ])
    f.write('\n'.join(output).rstrip())

"""CLI module."""

import argparse
import typing

from . import segmenter


def main(argv: typing.Optional[typing.Sequence] = None):
    """
    Segment WebVTT file from command line.

    :param argv: command line arguments
    """
    arguments = argparse.ArgumentParser(
        description='Segment WebVTT files.'
        )
    arguments.add_argument(
        'command',
        choices=['segment'],
        help='command to perform'
        )
    arguments.add_argument(
        'file',
        metavar='PATH',
        help='WebVTT file'
        )
    arguments.add_argument(
        '-o', '--output',
        metavar='PATH',
        help='output directory'
        )
    arguments.add_argument(
        '-d', '--target-duration',
        metavar='NUMBER',
        type=int,
        default=segmenter.DEFAULT_SECONDS,
        help='target duration of each segment in seconds, default: 10'
        )
    arguments.add_argument(
        '-m', '--mpegts',
        metavar='NUMBER',
        type=int,
        default=segmenter.DEFAULT_MPEGTS,
        help='presentation timestamp value, default: 900000'
        )

    args = arguments.parse_args(argv)

    segmenter.segment(
        args.file,
        args.output,
        args.target_duration,
        args.mpegts
        )


if __name__ == '__main__':
    main()  # pragma: no cover

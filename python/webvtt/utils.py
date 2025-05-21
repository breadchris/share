"""Utils module."""

import typing
import codecs

CODEC_BOMS = {
    'utf-8': codecs.BOM_UTF8,
    'utf-32-le': codecs.BOM_UTF32_LE,
    'utf-32-be': codecs.BOM_UTF32_BE,
    'utf-16-le': codecs.BOM_UTF16_LE,
    'utf-16-be': codecs.BOM_UTF16_BE
}


class FileWrapper:
    """File handling functionality with built-in support for Byte OrderMark."""

    def __init__(
            self,
            file_path: str,
            mode: typing.Optional[str] = None,
            encoding: typing.Optional[str] = None
            ):
        """
        Initialize.

        :param file_path: path to the file
        :param mode: mode in which the file is opened
        :param encoding: name of the encoding used to decode the file
        """
        self.file_path = file_path
        self.mode = mode or 'r'
        self.bom_encoding = self.detect_bom_encoding(file_path)
        self.encoding = (self.bom_encoding or
                         encoding or
                         'utf-8'
                         )

    @classmethod
    def open(
            cls,
            file_path: str,
            mode: typing.Optional[str] = None,
            encoding: typing.Optional[str] = None
            ) -> 'FileWrapper':
        """
        Open a file.

        :param file_path: path to the file
        :param mode: mode in which the file is opened
        :param encoding: name of the encoding used to decode the file
        """
        return cls(file_path, mode, encoding)

    def __enter__(self):
        """Enter context."""
        self.file = open(
            file=self.file_path,
            mode=self.mode,
            encoding=self.encoding
            )
        if self.bom_encoding:
            self.file.seek(len(CODEC_BOMS[self.bom_encoding]))
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context."""
        self.file.close()

    @staticmethod
    def detect_bom_encoding(file_path: str) -> typing.Optional[str]:
        """
        Detect the encoding of a file based on the presence of the BOM.

        :param file_path: path to the file
        :returns: the encoding if BOM is found or None.
        """
        with open(file_path, mode='rb') as f:
            first_bytes = f.read(4)
            for encoding, bom in CODEC_BOMS.items():
                if first_bytes.startswith(bom):
                    return encoding
        return None


def iter_blocks_of_lines(
        lines: typing.Iterable[str]
        ) -> typing.Generator[typing.List[str], None, None]:
    """
    Iterate blocks of text.

    :param lines: lines of text.
    """
    current_text_block = []

    for line in lines:
        if line.strip():
            current_text_block.append(line)
        elif current_text_block:
            yield current_text_block
            current_text_block = []

    if current_text_block:
        yield current_text_block

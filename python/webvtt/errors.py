"""Errors module."""


class MalformedFileError(Exception):
    """File is not in the right format."""


class MalformedCaptionError(Exception):
    """Caption not in the right format."""


class MissingFilenameError(Exception):
    """Missing a filename when saving to disk."""

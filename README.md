# Litmus Test

Run Litmus Tests directly from the command line using Node.

## Install

`$ npm install litmus-test`

## Usage

Point Litmus Test to files on the internet:

```
$ litmus-test -url http://domain.com/email.html
```

Or simply pipe a file at it:

```
$ cat email.html | litmus-test
```
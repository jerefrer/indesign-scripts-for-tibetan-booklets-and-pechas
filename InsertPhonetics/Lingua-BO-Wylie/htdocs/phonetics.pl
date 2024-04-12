#!/usr/bin/perl

use strict;
use lib '/srv/www/perl-lib';
use Encode ();

use CGI ();
$CGI::POST_MAX = 1024 * 1024;	# max 1MB posts
$CGI::DISABLE_UPLOADS = 1;  	# no uploads

binmode(STDOUT, ":utf8");

my $input = CGI::param("input");
$input = '' unless defined $input;
$input = Encode::decode_utf8($input);

my $sep_join = CGI::param("sep_join");
$sep_join = '' unless defined $sep_join;
$sep_join = Encode::decode_utf8($sep_join);
my $sep_join_enc = CGI::escapeHTML($sep_join);

my $words = CGI::param("words") || "none";
my $type = CGI::param("type") || "thl";

my $show = $input;

# perl-generate the selects so we can keep the values on page reload
my %selects = (
  words	=> [
	[ "auto", 	"Use built-in word list" ],
  	[ "none",	"Handle each syllable separately" ],
	[ "join", 	"Syllables in a word joined by" ],
	[ "sep", 	"Words separated by" ],
  ],
  type	=> [
  	[ "thl",	"THL Simplified Phonemic Transcription" ],
  	[ "rigpa-en",	"Rigpa Phonetics - ENGLISH" ],
  	[ "rigpa-fr",	"Rigpa Phonetics - FRENCH" ],
  	[ "rigpa-es",	"Rigpa Phonetics - SPANISH" ],
  	[ "rigpa-de",	"Rigpa Phonetics - GERMAN" ],
  	[ "padmakara-en",	"Padmakara EN - Int. Simplified Phonetics" ],
  	[ "padmakara-pt",	"Padmakara PT - Int. Simplified Phonetics" ],
  	[ "lhasey-en",	"Lhasey Lotsawa" ],
  ],
);

sub trim {
  my $string = shift;
  $string =~ s/^\s+|\s+$//gs;
  $string;
}

sub make_options {
  my $name = shift;
  my @out;
  my $opts = $selects{$name};
  foreach my $opt (@$opts) {
    my ($value, $label);
    if (ref($opt)) {
      ($value, $label) = @$opt;
    } else {
      $value = $label = $opt;
    }
    my $sel = ((CGI::param($name) || '') eq $value) ? 'selected' : '';
    push @out, qq{<option $sel value="$value">$label</option>\n};
  }
  return join '', @out;
}

my %pho_args = ();
if ($words eq 'auto') {
  $pho_args{autosplit} = 1;
}  elsif ($words eq 'sep' && $sep_join ne '') {
  $pho_args{separator} = $sep_join;
}  elsif ($words eq 'join' && $sep_join ne '') {
  $pho_args{joiner} = $sep_join;
}

my $class = 'Lingua::BO::Phonetics';
my %class_args;

if ($type =~ /^rigpa-(\w\w)$/) {
  $class_args{lang} = $1;
  $class = "Lingua::BO::Phonetics::Rigpa";

} elsif ($type =~ /^padmakara-(\w\w)$/) {
  die "Padmakara is only supported in Portuguese and English for now.\n" unless $1 eq 'pt' || $1 eq 'en';
  $class_args{lang} = $1;
  $class = 'Lingua::BO::Phonetics::Padmakara';

} elsif ($type =~ /^lhasey-(\w\w)$/) {
  die "Lhasey is only supported in English for now.\n" unless $1 eq 'en';
  $class_args{lang} = $1;
  $class = 'Lingua::BO::Phonetics::Lhasey';
}

eval "require $class"; die $@ if $@;

my %html_options = map { $_ => make_options($_) } keys %selects;

$input =~ s/(?:\r|\n)*$//;
$input =~ s/\r\n|\r|\n/\n/g;

my $out = '';
my $warns;
my $checked = '';

if ($input ne '') {
  my $pho = $class->new(print_warnings => 0, %class_args);
  $out = $pho->phonetics($input, %pho_args);
  $warns = $pho->get_warnings();

  # "add input to output" code by Martin Dudek <goosebumps4all@gmail.com>
  if (CGI::param('addInput')) {
    $checked = "checked='checked'";
    my @valuesinput = split "\n", $input;
    my @valuesoutput = split "\n", $out;
    $out = '';

    for my $j (0 .. $#valuesinput) {
      my $in = trim($valuesinput[$j]);
      $out .= $in . "\n";
      $out .= trim($valuesoutput[$j]) . "\n" if $in ne "";
    }
  }
}

# plain text output?
if (CGI::param('plain')) {
  print CGI::header(-charset => "utf-8", -type => "text/plain");
  print $out;
  if ($warns && @$warns) {
    print "\n\n---\n";
    foreach my $w (@$warns) {
      print "$w\n";
    }
  }
  exit 0;
}

# HTML output
print CGI::header(-charset => "utf-8");

print <<_HTML_;
<html>
<head>
<style>
.clearfix:before, .clearfix:after { content:""; display:table }
.clearfix:after { clear:both }

body { background: #fff }
body, td, input, select, textarea { font-family:verdana, tahoma, helvetica; font-size: 13px; }
.tib { font-family: "Tibetan Machine Uni"; font-size: 28px; }
.warn { font-family: tahoma; font-size: 12px; }
.eng { font-family: tahoma; font-size: 14px; }
.after { font-size: 13px; margin-top:5px }
.title { font-size: 18px; font-weight: bold; }
textarea#id__txt { margin-top: 5px; margin-bottom: 5px; padding: 5px; border: 1px solid blue; height: 120px; width: 100%; font-family: fixed; font-size: 14px; }
input, select { border:1px solid #aaa; background:#fff; padding:6px; border-radius:2px; color:#333 }

.head2 > div { line-height:24px; margin-top:5px }
.head2 > .one > .left { white-space:nowrap; display:inline-block; min-width:140px; padding:0 8px; box-sizing:border-box; text-align:right }
.head2 > .one > .right { white-space:nowrap; display:inline-block }

\@media screen and (max-width:600px) {
	.head2 > .one > .left { display:block; text-align:left }
	.head2 > .one > .right { display:block }
	.head2 > .one.chk > .left { display:inline-block; min-width:auto }
	.head2 > .one.chk > .right { display:inline-block }
	.head2 > .one.submit > .left { display:none }
	.head2 > .one.submit > .right { text-align:center }
}

</style>
<title>Tibetan Phonetics Generator</title>
</head>
<body>
<div style="width:95%; max-width:900px; margin:0 auto">
<form id="id__form" method="POST">
<span class="title">Tibetan Phonetics Generator</span><br><br>

<div>
Paste your Tibetan text below in Unicode or Wylie, and click "Make Phonetics" or press Ctrl+Enter.
</div>

<textarea id="id__txt" style="font-size: 14px;" onkeydown="return textarea_keydown(event);" name="input">$show</textarea><br>

<div class="head2">
	<div class="one">
		<div class="left">Word splitting:</div>
		<div class="right">
			<select id="id__words" name="words" onchange="javascript:change_words();">$html_options{words}</select>
			<input style="display: none;" type="text" size="2" maxlength="3" id="id__sep_join" name="sep_join" value="$sep_join_enc">
		</div>
	</div>
	<div class="one">
		<div class="left">Phonemic system:</div>
		<div class="right">
			<select id="id__type" name="type">$html_options{type}</select>
		</div>
	</div>
	<div class="one chk">
		<div class="left"><input id="id-plaintext" type="checkbox" name="plain" value="y"></div>
		<div class="right"><label for="id-plaintext">Plain text output</label></div>
	</div>
	<div class="one chk" style="margin-top:0">
		<div class="left"><input id="id-add" type="checkbox" name="addInput" value="y"></div>
		<div class="right"><label for="id-add">Add input to output</label></div>
	</div>

	<div class="one submit">
		<div class="left"></div>
		<div class="right">
		<input type="submit" name="send" value="Make Phonetics" onclick="javascript:return check_form();" style="font-weight:bold; min-width:200px">
		</div>
	</div>
</div>

<div style="color:#c00; margin-top:15px">Please note that automatically generated phonetics cannot possibly be 100% accurate, because the way
words are separated in Tibetan is inherently ambiguous. It is important that someone who understands
the Tibetan text checks the phonetics.</div>
</form>
<br>

_HTML_

if ($out ne '') {
  $out = CGI::escapeHTML($out);

  print <<_HTML_;
Tibetan Phonetics:<br>
<textarea style="border: 1px solid #888; background: #eef; padding: 8px; width: 100%; height: 250px; box-sizing:border-box; margin-top:5px" class="eng">$out</textarea><br>
_HTML_
}

if ($warns && @$warns) {
  $warns = join "<br>\n", map { CGI::escapeHTML($_) } @$warns;
  print <<_HTML_;
<br>
Warnings:
<div style="border: 1px solid #888; background: #ffa; padding: 8px; width: 100%; box-sizing:border-box; margin-top:5px" class="warn">
$warns
</div>
_HTML_
}

finish();

sub finish {
  print <<_HTML_;
<div class="after" style="margin-top:32px; line-height:1.5">
&bull; This conversion code is Free Software; you can <a href="https://www.lotsawahouse.org/Static/Lingua-BO-Wylie-dev.zip">download the Perl module here</a>.

<br>&bull; See the definition of <a target="_blank" href="http://www.thlib.org/reference/transliteration/#essay=/thl/phonetics/">THL 
Simplified Tibetan Phonemic Transcription</a>

<!--
<br>&bull; View the <a href="/cgi-bin/view-list.pl?list=rigpa_words" rel="nofollow">word list</a> and the <a href="/cgi-bin/view-list.pl?list=rigpa_exceptions" rel="nofollow">exceptions list</a> for Rigpa English Phonetics. -->

</div>

<br><br>
<script language="javascript">
function textarea_keydown(e) {
  // submit on control-Enter
  if (e && e.keyCode == 13 && e.ctrlKey) {
    document.getElementById('id__form').submit();
    return false;
  }
  return true;
}

function change_words() {
  var e = document.getElementById('id__words');
  var wds = e.options[e.selectedIndex].value;
  if (wds == 'sep' || wds == 'join') {
    document.getElementById('id__sep_join').style.display="inline";
  } else {
    document.getElementById('id__sep_join').style.display="none";
  }
}

function check_form() {
  var e = document.getElementById('id__words');
  var wds = e.options[e.selectedIndex].value;
  var sj = document.getElementById('id__sep_join').value;
  if (sj == '') {
    if (wds == 'sep') {
      alert("Please specify the character or string used to separate words.");
      var sj = document.getElementById('id__sep_join').select();
      return false;
    } else if (wds == 'join') {
      alert("Please specify the character or string used to join syllables in the same word.");
      var sj = document.getElementById('id__sep_join').select();
      return false;
    }
  }
  return true;
}

document.getElementById('id__txt').select();
document.getElementById('id__txt').focus();
change_words();

</script>

</div>
</body>
</html>
_HTML_
}


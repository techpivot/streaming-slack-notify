# enable all linting rules by default, then override below
all

# We include HTML in some areas and this rule is buggy
exclude_rule "no-inline-html"

# This is buggy and doesn't work well
exclude_rule "no-bare-urls"

# Increase line-length to 120
rule 'MD013', :line_length => 120
